<?php
namespace app\models;

use yii\db\ActiveRecord;

class Comment extends ActiveRecord
{
    public static function tableName()
    {
        return '{{%comment}}';
    }

    public function rules()
    {
        return [
            [['post_id', 'content'], 'required'],
            ['post_id', 'integer'],
            ['content', 'string'],
            ['author_name', 'string', 'max' => 255],
            ['author_email', 'string', 'max' => 255],
            ['website', 'string', 'max' => 255],
            ['author_avatar', 'string'],
            ['parent_id', 'integer'],
            ['created_at', 'safe'],
        ];
    }

    public function getPost()
    {
        return $this->hasOne(Post::class, ['id' => 'post_id']);
    }
}
