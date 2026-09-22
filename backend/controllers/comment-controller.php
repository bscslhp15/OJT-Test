<?php
namespace app\controllers;

use app\models\Comment;
use app\models\Post;
use app\models\User;
use Yii;
use yii\rest\ActiveController;
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
            ];
        }, $query->all());
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
            ];
        }
        return $comment->errors;
    }
}
