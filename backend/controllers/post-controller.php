<?php
namespace app\controllers;

use app\models\Post;
use app\models\User;
use Yii;
use yii\rest\ActiveController;
use yii\web\ForbiddenHttpException;

class PostController extends ActiveController
{
    public $modelClass = Post::class;

    public function actions()
    {
        $actions = parent::actions();
        unset($actions['index'], $actions['view'], $actions['delete'], $actions['update'], $actions['create']);
        return $actions;
    }

    public function actionCreate()
    {
        $body = Yii::$app->request->bodyParams;
        $authKey = $body['authKey'] ?? null;
        $user = $authKey ? User::findOne(['auth_key' => $authKey]) : Yii::$app->user->identity;
        if (!$user || !$user->confirmed) {
            throw new ForbiddenHttpException('Only confirmed users can create posts.');
        }

        $post = new Post();
        $post->title = $body['title'] ?? null;
        $post->content = $body['content'] ?? null;
        $post->image = $body['image'] ?? null;
        $post->slug = $body['slug'] ?? null;
        $post->category = $body['category'] ?? 'Uncategorized';
        $post->tags = json_encode($body['tags'] ?? []);
        $post->status = $body['status'] ?? 'published';
        $post->allow_comments = array_key_exists('allowComments', $body) ? (bool)$body['allowComments'] : true;
        $post->author_id = $user->id;
        $post->created_at = date('Y-m-d H:i:s');
        if ($post->save()) {
            return [
                'success' => true,
                'post' => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'image' => $post->image,
                    'slug' => $post->slug,
                    'category' => $post->category,
                    'tags' => json_decode($post->tags ?: '[]', true) ?: [],
                    'status' => $post->status,
                    'allowComments' => (bool)$post->allow_comments,
                    'author_id' => $post->author_id,
                    'authorUserId' => $post->author_id,
                    'created_at' => $post->created_at,
                ],
            ];
        }
        return $post->errors;
    }

    public function actionUpdate($id)
    {
        $post = Post::findOne($id);
        $body = Yii::$app->request->bodyParams;
        $authKey = $body['authKey'] ?? null;
        $user = $authKey ? User::findOne(['auth_key' => $authKey]) : Yii::$app->user->identity;
        if (!$post || !$user || $post->author_id !== $user->id) {
            throw new ForbiddenHttpException('You can only edit your own posts.');
        }
        $post->title = $body['title'] ?? $post->title;
        $post->content = $body['content'] ?? $post->content;
        $post->image = $body['image'] ?? $post->image;
        $post->slug = $body['slug'] ?? $post->slug;
        $post->category = $body['category'] ?? $post->category;
        $post->tags = array_key_exists('tags', $body) ? json_encode($body['tags']) : $post->tags;
        $post->status = $body['status'] ?? $post->status;
        if (array_key_exists('allowComments', $body)) $post->allow_comments = (bool)$body['allowComments'];
        if ($post->save()) {
            return ['success' => true, 'post' => $post];
        }
        return $post->errors;
    }

    public function actionDelete($id)
    {
        $post = Post::findOne($id);
        $body = Yii::$app->request->bodyParams;
        $authKey = $body['authKey'] ?? null;
        $user = $authKey ? User::findOne(['auth_key' => $authKey]) : Yii::$app->user->identity;
        if (!$post || !$user || $post->author_id !== $user->id) {
            throw new ForbiddenHttpException('You can only delete your own posts.');
        }
        $post->delete();
        return ['success' => true];
    }

    public function actionIndex()
    {
        $posts = Post::find()->orderBy(['created_at' => SORT_DESC])->all();
        return array_map(function ($post) {
            return [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'image' => $post->image,
                'slug' => $post->slug ?: strtolower(str_replace(' ', '-', $post->title)),
                'category' => $post->category ?: 'Uncategorized',
                'tags' => json_decode($post->tags ?: '[]', true) ?: [],
                'status' => $post->status ?: 'published',
                'allowComments' => (bool)$post->allow_comments,
                'author_id' => $post->author_id,
                'authorUserId' => $post->author_id,
                'date' => date('m/d/Y', strtotime($post->created_at)),
                'created_at' => $post->created_at,
                'publishedAt' => $post->created_at,
                'status' => 'published',
                'category' => $post->category ?: 'Uncategorized',
                'slug' => $post->slug ?: strtolower(str_replace(' ', '-', preg_replace('/[^A-Za-z0-9 ]+/', '', $post->title))),
                'tags' => json_decode($post->tags ?: '[]', true) ?: [],
                'status' => $post->status ?: 'published',
                'author' => $post->author ? trim(($post->author->first_name ?? '') . ' ' . ($post->author->last_name ?? '')) ?: $post->author->username : 'Author',
                'authorId' => $post->author ? $post->author->email : '',
                'authorAvatar' => $post->author ? $post->author->profile_photo : '',
                'authorBio' => $post->author ? ($post->author->bio ?? '') : '',
                'authorSocial' => $post->author ? [
                    'facebook' => $post->author->facebook,
                    'twitter' => $post->author->twitter,
                    'instagram' => $post->author->instagram,
                    'linkedin' => $post->author->linkedin,
                ] : [],
            ];
        }, $posts);
    }

    public function actionView($id)
    {
        $post = Post::findOne($id);
        if (!$post) {
            return null;
        }
        return [
            'id' => $post->id,
            'title' => $post->title,
            'content' => $post->content,
            'image' => $post->image,
            'slug' => $post->slug ?: strtolower(str_replace(' ', '-', $post->title)),
            'category' => $post->category ?: 'Uncategorized',
            'tags' => json_decode($post->tags ?: '[]', true) ?: [],
            'status' => $post->status ?: 'published',
            'allowComments' => (bool)$post->allow_comments,
            'author_id' => $post->author_id,
                'authorUserId' => $post->author_id,
            'date' => date('m/d/Y', strtotime($post->created_at)),
            'created_at' => $post->created_at,
            'publishedAt' => $post->created_at,
            'status' => 'published',
            'category' => $post->category ?: 'Uncategorized',
            'slug' => $post->slug ?: strtolower(str_replace(' ', '-', preg_replace('/[^A-Za-z0-9 ]+/', '', $post->title))),
            'tags' => json_decode($post->tags ?: '[]', true) ?: [],
            'status' => $post->status ?: 'published',
            'author' => $post->author ? trim(($post->author->first_name ?? '') . ' ' . ($post->author->last_name ?? '')) ?: $post->author->username : 'Author',
            'authorId' => $post->author ? $post->author->email : '',
            'authorAvatar' => $post->author ? $post->author->profile_photo : '',
            'authorBio' => $post->author ? ($post->author->bio ?? '') : '',
            'authorSocial' => $post->author ? [
                'facebook' => $post->author->facebook,
                'twitter' => $post->author->twitter,
                'instagram' => $post->author->instagram,
                'linkedin' => $post->author->linkedin,
            ] : [],
        ];
    }
}
