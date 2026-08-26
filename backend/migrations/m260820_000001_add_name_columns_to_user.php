<?php

use yii\db\Migration;

class m260820_000001_add_name_columns_to_user extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'first_name', $this->string()->null());
        $this->addColumn('{{%user}}', 'last_name', $this->string()->null());
    }

    public function safeDown()
    {
        $this->dropColumn('{{%user}}', 'last_name');
        $this->dropColumn('{{%user}}', 'first_name');
    }
}