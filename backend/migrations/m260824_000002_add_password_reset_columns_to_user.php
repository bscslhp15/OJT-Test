<?php

use yii\db\Migration;

class m260824_000002_add_password_reset_columns_to_user extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'password_reset_token', $this->string(64)->null());
        $this->addColumn('{{%user}}', 'password_reset_expires_at', $this->dateTime()->null());
        $this->createIndex('idx-user-password-reset-token', '{{%user}}', 'password_reset_token', true);
    }

    public function safeDown()
    {
        $this->dropIndex('idx-user-password-reset-token', '{{%user}}');
        $this->dropColumn('{{%user}}', 'password_reset_expires_at');
        $this->dropColumn('{{%user}}', 'password_reset_token');
    }
}