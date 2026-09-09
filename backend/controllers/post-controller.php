<?php
namespace app\controllers;

use app\models\Post;
use Yii;
use yii\rest\ActiveController;
use yii\web\ForbiddenHttpException;

class PostController extends ActiveController
{
    public $modelClass = Post::class;

    public function actions()
    {
        $actions = parent::actions();
        unset($actions['delete'], $actions['update'], $actions['create']);
        return $actions;
    }

    public function actionCreate()
    {
        $body = Yii::$app->request->bodyParams;
        $user = Yii::$app->user->identity;
        if (!$user || !$user->confirmed) {
            throw new ForbiddenHttpException('Only confirmed users can create posts.');
        }

        $post = new Post();
        $post->title = $body['title'] ?? null;
        $post->content = $body['content'] ?? null;
        $post->author_id = $user->id;
        $post->created_at = date('Y-m-d H:i:s');
        if ($post->save()) {
            return $post;
        }
        return $post->errors;
    }

    public function actionUpdate($id)
    {
        $post = Post::findOne($id);
        $user = Yii::$app->user->identity;
        if (!$post || !$user || $post->author_id !== $user->id) {
            throw new ForbiddenHttpException('You can only edit your own posts.');
        }
        $body = Yii::$app->request->bodyParams;
        $post->title = $body['title'] ?? $post->title;
        $post->content = $body['content'] ?? $post->content;
        if ($post->save()) {
            return $post;
        }
        return $post->errors;
    }

    public function actionDelete($id)
    {
        $post = Post::findOne($id);
        $user = Yii::$app->user->identity;
        if (!$post || !$user || $post->author_id !== $user->id) {
            throw new ForbiddenHttpException('You can only delete your own posts.');
        }
        $post->delete();
        return ['success' => true];
    }
}
