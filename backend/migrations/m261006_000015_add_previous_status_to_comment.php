<?php

use yii\db\Migration;

class m261006_000015_add_previous_status_to_comment extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%comment}}', 'previous_status', $this->string(16)->null());
    }

    public function safeDown()
    {
        $this->dropColumn('{{%comment}}', 'previous_status');
    }
}
