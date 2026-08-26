<?php

use yii\db\Migration;

class m260826_000004_add_confirmation_expiry_to_user extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'confirmation_expires_at', $this->dateTime()->null());
    }

    public function safeDown()
    {
        $this->dropColumn('{{%user}}', 'confirmation_expires_at');
    }
}