<?php

use yii\db\Migration;

class m261006_000013_add_website_to_user extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'website', $this->string()->null());
    }

    public function safeDown()
    {
        $this->dropColumn('{{%user}}', 'website');
    }
}
