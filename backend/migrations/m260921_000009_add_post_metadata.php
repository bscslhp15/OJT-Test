<?php

use yii\db\Migration;

class m260921_000009_add_post_metadata extends Migration
{
    public function safeUp()
    {
        $table = $this->db->getTableSchema('{{%post}}', true);
        if (!$table->getColumn('slug')) $this->addColumn('{{%post}}', 'slug', $this->string(255)->null());
        if (!$table->getColumn('category')) $this->addColumn('{{%post}}', 'category', $this->string(255)->null());
        if (!$table->getColumn('tags')) $this->addColumn('{{%post}}', 'tags', $this->text()->null());
        if (!$table->getColumn('status')) $this->addColumn('{{%post}}', 'status', $this->string(32)->null());

    }

    public function safeDown()
    {
        $table = $this->db->getTableSchema('{{%post}}', true);
        foreach (['status', 'tags', 'category', 'slug'] as $column) {
            if ($table->getColumn($column)) $this->dropColumn('{{%post}}', $column);
        }
    }
}