<?php

use yii\db\Migration;

class m260826_000003_add_profile_columns_to_user extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'phone', $this->string()->null());
        $this->addColumn('{{%user}}', 'address', $this->string()->null());
        $this->addColumn('{{%user}}', 'facebook', $this->string()->null());
        $this->addColumn('{{%user}}', 'instagram', $this->string()->null());
    }

    public function safeDown()
    {
        $this->dropColumn('{{%user}}', 'instagram');
        $this->dropColumn('{{%user}}', 'facebook');
        $this->dropColumn('{{%user}}', 'address');
        $this->dropColumn('{{%user}}', 'phone');
    }
}