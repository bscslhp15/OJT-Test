<?php

use yii\db\Migration;

class m260919_000005_add_image_columns extends Migration
{
    public function safeUp()
    {
        $this->addColumn('{{%post}}', 'image', $this->text()->null());
        $this->alterColumn('{{%user}}', 'profile_photo', $this->text()->null());
    }

    public function safeDown()
    {
        $this->alterColumn('{{%user}}', 'profile_photo', $this->string()->null());
        $this->dropColumn('{{%post}}', 'image');
    }
}