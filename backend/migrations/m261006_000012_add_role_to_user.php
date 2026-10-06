<?php

use yii\db\Migration;

class m261006_000012_add_role_to_user extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%user}}', 'role', $this->string(32)->notNull()->defaultValue('Author'));

        $adminEmail = strtolower(trim((string) (Yii::$app->params['adminEmail'] ?? '')));
        if ($adminEmail !== '') {
            $this->update('{{%user}}', ['role' => 'Administrator'], 'LOWER(email) = :email', [':email' => $adminEmail]);
        }
    }

    public function safeDown()
    {
        $this->dropColumn('{{%user}}', 'role');
    }
}
