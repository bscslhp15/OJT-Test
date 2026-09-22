<?php
namespace app\models;

use yii\db\ActiveRecord;

class Post extends ActiveRecord
{
    public static function tableName()
    {
        return '{{%post}}';
    }

    public function rules()
    {
        return [
            [['title', 'content', 'author_id'], 'required'],
            ['title', 'string', 'max' => 255],
            ['content', 'string'],
            ['image', 'string'],
            ['slug', 'string', 'max' => 255],
            ['category', 'string', 'max' => 255],
            ['tags', 'string'],
            ['status', 'string', 'max' => 32],
            ['allow_comments', 'boolean'],
            ['author_id', 'integer'],
            ['created_at', 'safe'],
        ];
    }

    public function getAuthor()
    {
        return $this->hasOne(User::class, ['id' => 'author_id']);
    }
}
