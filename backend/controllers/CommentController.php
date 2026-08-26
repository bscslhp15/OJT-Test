<?php
namespace app\controllers;

use app\models\Comment;
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
        unset($actions['delete'], $actions['update'], $actions['create']);
        return $actions;
    }

    public function actionCreate()
    {
        $body = Yii::$app->request->bodyParams;
        $comment = new Comment();
        $comment->post_id = $body['post_id'] ?? null;
        $comment->content = $body['content'] ?? null;
        if (!empty($body['authKey'])) {
            $user = User::findIdentityByAccessToken($body['authKey']);
            if (!$user || !$user->confirmed) {
                throw new ForbiddenHttpException('Confirmed users only.');
            }
            $comment->author_name = $user->username;
        } else {
            $comment->author_name = $body['author_name'] ?? 'Guest';
        }
        $comment->created_at = date('Y-m-d H:i:s');
        if ($comment->save()) {
            return $comment;
        }
        return $comment->errors;
    }
}
