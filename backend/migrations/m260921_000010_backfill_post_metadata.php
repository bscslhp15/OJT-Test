<?php

use yii\db\Migration;

class m260921_000010_backfill_post_metadata extends Migration
{
    public function safeUp()
    {
        foreach ((new \yii\db\Query())->from('{{%post}}')->all() as $post) {
            $this->update('{{%post}}', [
                'slug' => strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $post['title']), '-')),
                'category' => $post['category'] ?: 'Uncategorized',
                'tags' => $post['tags'] ?: '[]',
                'status' => $post['status'] ?: 'published',
            ], ['id' => $post['id']]);
        }
    }

    public function safeDown()
    {
    }
}