<?php

use yii\db\Migration;

class m260922_000011_add_allow_comments_to_post extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%post}}', 'allow_comments', $this->boolean()->notNull()->defaultValue(true));
    }

    public function safeDown()
    {
        $this->dropColumn('{{%post}}', 'allow_comments');
    }
}
