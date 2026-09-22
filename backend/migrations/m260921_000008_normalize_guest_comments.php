<?php

use yii\db\Migration;

class m260921_000008_normalize_guest_comments extends Migration
{
    public function safeUp()
    {
        $this->delete('{{%comment}}', ['id' => 12]);

        $comments = (new \yii\db\Query())
            ->select(['id'])
            ->from('{{%comment}}')
            ->where(['author_name' => 'Guest'])
            ->all();

        foreach ($comments as $comment) {
            $this->update('{{%comment}}', [
                'author_name' => 'Guests ' . random_int(10000000, 99999999),
            ], ['id' => $comment['id']]);
        }
    }

    public function safeDown()
    {
    }
}