<?php

use yii\db\Migration;

class m260921_000006_add_comment_details extends Migration
{
    public function safeUp()
    {
        $table = $this->db->getTableSchema('{{%comment}}', true);
        if (!$table->getColumn('author_email')) $this->addColumn('{{%comment}}', 'author_email', $this->string()->null());
        if (!$table->getColumn('website')) $this->addColumn('{{%comment}}', 'website', $this->string()->null());
        if (!$table->getColumn('author_avatar')) $this->addColumn('{{%comment}}', 'author_avatar', $this->text()->null());
        if (!$table->getColumn('parent_id')) $this->addColumn('{{%comment}}', 'parent_id', $this->integer()->null());
    }

    public function safeDown()
    {
        $this->dropColumn('{{%comment}}', 'parent_id');
        $table = $this->db->getTableSchema('{{%comment}}', true);
        if ($table->getColumn('parent_id')) $this->dropColumn('{{%comment}}', 'parent_id');
        if ($table->getColumn('author_avatar')) $this->dropColumn('{{%comment}}', 'author_avatar');
        if ($table->getColumn('website')) $this->dropColumn('{{%comment}}', 'website');
        if ($table->getColumn('author_email')) $this->dropColumn('{{%comment}}', 'author_email');
    }
}