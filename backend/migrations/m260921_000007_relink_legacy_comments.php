<?php

use yii\db\Migration;

class m260921_000007_relink_legacy_comments extends Migration
{
    public function safeUp()
    {
        // These comments belong to the current imported "test" post.
        $this->update('{{%comment}}', ['post_id' => 4], ['post_id' => 1786687040635]);
    }

    public function safeDown()
    {
        $this->update('{{%comment}}', ['post_id' => 1786687040635], ['post_id' => 4]);
    }
}