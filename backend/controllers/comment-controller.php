<?php
namespace app\controllers;

use app\models\Comment;
use app\models\Post;
use app\models\User;
use Yii;
use yii\rest\ActiveController;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;

class CommentController extends ActiveController
{
    public $modelClass = Comment::class;

    public function actions()
    {
        $actions = parent::actions();
        unset($actions['index'], $actions['view'], $actions['delete'], $actions['update'], $actions['create']);
        return $actions;
    }

    public function actionIndex()
    {
        $postId = Yii::$app->request->get('post_id');
        $query = Comment::find()->orderBy(['created_at' => SORT_ASC]);
        if ($postId !== null && $postId !== '') {
            $query->andWhere(['post_id' => $postId]);
        }

        $authKey = Yii::$app->request->headers->get('X-Auth-Key', '');
        $viewer = $authKey ? User::findOne(['auth_key' => $authKey]) : null;
        $includePending = Yii::$app->request->get('include_pending') === '1'
            && $viewer
            && $this->isAdminUser($viewer);
        if (!$includePending) {
            if ($viewer) {
                $query->andWhere([
                    'or',
                    ['status' => 'approved'],
                    ['and', ['status' => 'pending'], ['author_email' => $viewer->email]],
                ]);
            } else {
                $query->andWhere(['status' => 'approved']);
            }
        }

        return array_map(function ($comment) {
            $author = $comment->author_email ? User::findByEmail($comment->author_email) : null;
            return [
                'id' => $comment->id,
                'post_id' => $comment->post_id,
                'name' => $comment->author_name,
                'email' => $comment->author_email,
                'website' => $comment->website,
                'avatar' => $author?->profile_photo ?: $comment->author_avatar,
                'text' => $comment->content,
                'date' => date('m/d/Y', strtotime($comment->created_at)),
                'parentId' => $comment->parent_id,
                'status' => $comment->status,
                'previousStatus' => $comment->previous_status,
            ];
        }, $query->all());
    }

    public function actionModerate()
    {
        $this->requireAdminUser();
        $body = Yii::$app->request->bodyParams;
        $commentId = filter_var($body['commentId'] ?? null, FILTER_VALIDATE_INT);
        $action = $body['action'] ?? '';
        if ($commentId === false || $commentId < 1 || !in_array($action, ['approve', 'unapprove', 'spam', 'not-spam', 'trash', 'restore', 'delete-permanently'], true)) {
            throw new BadRequestHttpException('Choose a valid comment and moderation action.');
        }

        $comment = Comment::findOne($commentId);
        if (!$comment) {
            throw new BadRequestHttpException('Comment not found.');
        }

        if ($action === 'delete-permanently') {
            $idsToDelete = [(string) $comment->id];
            $pendingIds = $idsToDelete;
            while ($pendingIds) {
                $childIds = Comment::find()->select('id')->where(['parent_id' => $pendingIds])->column();
                $childIds = array_values(array_diff(array_map('strval', $childIds), $idsToDelete));
                $idsToDelete = array_merge($idsToDelete, $childIds);
                $pendingIds = $childIds;
            }
            Comment::deleteAll(['id' => array_map('intval', $idsToDelete)]);
            return ['success' => true, 'id' => $commentId, 'deleted' => true];
        }

        if ($action === 'unapprove') {
            $comment->status = 'pending';
            $comment->previous_status = null;
        } elseif ($action === 'approve') {
            $comment->status = 'approved';
            $comment->previous_status = null;
        } elseif ($action === 'spam') {
            if ($comment->status !== 'trash' && $comment->status !== 'spam') {
                $comment->previous_status = $comment->status;
            }
            $comment->status = 'spam';
        } elseif ($action === 'not-spam') {
            $comment->status = in_array($comment->previous_status, ['approved', 'pending'], true)
                ? $comment->previous_status
                : 'approved';
            $comment->previous_status = null;
        } elseif ($action === 'trash') {
            if ($comment->status !== 'trash') {
                $comment->previous_status = $comment->status;
            }
            $comment->status = 'trash';
        } elseif ($action === 'restore') {
            $comment->status = in_array($comment->previous_status, ['approved', 'pending', 'spam'], true)
                ? $comment->previous_status
                : 'approved';
            $comment->previous_status = null;
        }

        if (!$comment->save(false)) {
            throw new BadRequestHttpException('The comment status could not be updated.');
        }

        return ['success' => true, 'id' => $comment->id, 'status' => $comment->status, 'previousStatus' => $comment->previous_status];
    }

    public function actionUpdate($id)
    {
        $this->requireAdminUser();
        $comment = Comment::findOne($id);
        if (!$comment) {
            throw new BadRequestHttpException('Comment not found.');
        }

        $body = Yii::$app->request->bodyParams;
        $content = trim((string) ($body['text'] ?? $body['content'] ?? $comment->content));
        $status = strtolower(trim((string) ($body['status'] ?? $comment->status)));
        if ($content === '') {
            throw new BadRequestHttpException('Comment text cannot be empty.');
        }
        if (!in_array($status, ['approved', 'pending', 'spam', 'trash'], true)) {
            throw new BadRequestHttpException('Choose Approved, Pending, Spam, or Trash status.');
        }

        $comment->content = $content;
        $comment->author_name = trim((string) ($body['name'] ?? $comment->author_name));
        $comment->author_email = trim((string) ($body['email'] ?? $comment->author_email));
        $comment->website = trim((string) ($body['website'] ?? $comment->website));
        $comment->status = $status;
        $comment->previous_status = null;
        if (!$comment->save()) {
            throw new BadRequestHttpException('The comment could not be updated.');
        }

        return [
            'id' => $comment->id,
            'post_id' => $comment->post_id,
            'name' => $comment->author_name,
            'email' => $comment->author_email,
            'website' => $comment->website,
            'text' => $comment->content,
            'date' => date('m/d/Y', strtotime($comment->created_at)),
            'parentId' => $comment->parent_id,
            'status' => $comment->status,
            'previousStatus' => $comment->previous_status,
        ];
    }

    public function actionCreate()
    {
        $body = Yii::$app->request->bodyParams;
        $post = Post::findOne($body['post_id'] ?? null);
        if (!$post || !$post->allow_comments) {
            throw new ForbiddenHttpException('Comments are disabled for this post.');
        }
        $comment = new Comment();
        $comment->post_id = $body['post_id'] ?? null;
        $comment->content = $body['content'] ?? null;
        $comment->author_email = $body['author_email'] ?? null;
        $comment->website = $body['website'] ?? null;
        $comment->author_avatar = $body['avatar'] ?? null;
        $comment->parent_id = $body['parent_id'] ?? null;
        $comment->status = 'approved';
        if (!empty($body['authKey'])) {
            $user = User::findIdentityByAccessToken($body['authKey']);
            if (!$user || !$user->confirmed) {
                throw new ForbiddenHttpException('Confirmed users only.');
            }
            $comment->author_name = $user->username;
            $comment->author_email = $user->email;
            $comment->author_avatar = $user->profile_photo;
        } else {
            $guestName = trim((string)($body['author_name'] ?? ''));
            $comment->author_name = preg_match('/^Guests?\s+\d{8}$/i', $guestName)
                ? $guestName
                : 'Guests ' . random_int(10000000, 99999999);
        }
        $comment->created_at = date('Y-m-d H:i:s');
        if ($comment->save()) {
            return [
                'id' => $comment->id,
                'post_id' => $comment->post_id,
                'name' => $comment->author_name,
                'email' => $comment->author_email,
                'website' => $comment->website,
                'avatar' => $comment->author_avatar,
                'text' => $comment->content,
                'date' => date('m/d/Y', strtotime($comment->created_at)),
                'parentId' => $comment->parent_id,
                'status' => $comment->status,
            ];
        }
        return $comment->errors;
    }

    private function requireAdminUser()
    {
        $authKey = Yii::$app->request->headers->get('X-Auth-Key', '');
        $requestingUser = $authKey ? User::findOne(['auth_key' => $authKey]) : null;
        if (!$requestingUser || !$this->isAdminUser($requestingUser)) {
            throw new ForbiddenHttpException('Only administrators can moderate comments.');
        }
        return $requestingUser;
    }

    private function isAdminUser($user)
    {
        $adminEmail = strtolower(trim((string) (Yii::$app->params['adminEmail'] ?? '')));
        return strtolower(trim((string) $user->role)) === 'administrator'
            || ($adminEmail !== '' && strtolower(trim((string) $user->email)) === $adminEmail);
    }
}
