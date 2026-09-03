<?php
namespace app\controllers;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use Yii;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;

class ContactController extends Controller
{
    public function actionSendMessage()
    {
        $body = Yii::$app->request->bodyParams;
        $name = trim($body['name'] ?? '');
        $email = trim($body['email'] ?? '');
        $subject = trim($body['subject'] ?? '');
        $message = trim($body['message'] ?? '');

        if (!$name || !$email || !$subject || !$message) {
            throw new BadRequestHttpException('Name, email, subject, and message are required.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new BadRequestHttpException('Please provide a valid email address.');
        }

        $recipient = Yii::$app->params['contactRecipient'] ?? '';
        if (!$recipient || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
            Yii::error('Contact recipient email is not configured.', 'contact-mail');
            throw new BadRequestHttpException('The contact email is not configured yet.');
        }

        try {
            $mailer = new PHPMailer(true);
            $mailer->isSMTP();
            $mailer->Host = Yii::$app->params['smtpHost'];
            $mailer->Port = Yii::$app->params['smtpPort'];
            $mailer->SMTPAuth = true;
            $mailer->Username = Yii::$app->params['smtpUsername'];
            $mailer->Password = Yii::$app->params['smtpPassword'];
            $mailer->SMTPSecure = Yii::$app->params['smtpEncryption'] === 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mailer->CharSet = 'UTF-8';
            $mailer->setFrom(Yii::$app->params['mailFrom'], Yii::$app->params['mailFromName'] ?? 'TestSite');
            $mailer->addAddress($recipient);
            $mailer->addReplyTo($email, $name);
            $mailer->Subject = '[Contact Form] ' . $subject;
            $mailer->Body = "Name: {$name}\nEmail: {$email}\n\n{$message}";
            $mailer->send();

            return ['success' => true, 'message' => 'Your message has been sent successfully.'];
        } catch (Exception $exception) {
            Yii::error($exception->getMessage(), 'contact-mail');
            throw new BadRequestHttpException('The message could not be sent. Please check the mail server configuration.');
        }
    }
}
