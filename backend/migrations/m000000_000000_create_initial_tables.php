<?php

use yii\db\Migration;

class m000000_000000_create_initial_tables extends Migration
{
    public function safeUp()
    {
        $this->createTable('{{%user}}', [
            'id' => $this->primaryKey(),
            'username' => $this->string()->notNull()->unique(),
            'email' => $this->string()->notNull()->unique(),
            'password_hash' => $this->string()->notNull(),
            'auth_key' => $this->string(64)->notNull(),
            'confirmed' => $this->boolean()->notNull()->defaultValue(false),
            'profile_photo' => $this->string()->null(),
            'bio' => $this->text()->null(),
            'linkedin' => $this->string()->null(),
            'twitter' => $this->string()->null(),
            'created_at' => $this->dateTime()->notNull(),
        ]);

        $this->createTable('{{%post}}', [
            'id' => $this->primaryKey(),
            'title' => $this->string()->notNull(),
            'content' => $this->text()->notNull(),
            'author_id' => $this->integer()->notNull(),
            'created_at' => $this->dateTime()->notNull(),
        ]);
        $this->addForeignKey('fk-post-author', '{{%post}}', 'author_id', '{{%user}}', 'id', 'CASCADE', 'CASCADE');

        $this->createTable('{{%comment}}', [
            'id' => $this->primaryKey(),
            'post_id' => $this->integer()->notNull(),
            'author_name' => $this->string()->null(),
            'content' => $this->text()->notNull(),
            'created_at' => $this->dateTime()->notNull(),
        ]);
        $this->addForeignKey('fk-comment-post', '{{%comment}}', 'post_id', '{{%post}}', 'id', 'CASCADE', 'CASCADE');
    }

    public function safeDown()
    {
        $this->dropTable('{{%comment}}');
        $this->dropTable('{{%post}}');
        $this->dropTable('{{%user}}');
    }
}
