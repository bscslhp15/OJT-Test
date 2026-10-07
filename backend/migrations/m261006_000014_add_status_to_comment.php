<?php

use yii\db\Migration;

class m261006_000014_add_status_to_comment extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%comment}}', 'status', $this->string(16)->notNull()->defaultValue('approved'));
    }

    public function safeDown()
    {
        $this->dropColumn('{{%comment}}', 'status');
    }
}
