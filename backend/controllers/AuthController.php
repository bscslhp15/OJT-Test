<?php
namespace app\controllers;

use app\models\User;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use Yii;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;

class AuthController extends Controller
{
    public function behaviors()
    {
        $behaviors = parent::behaviors();
        $behaviors['corsFilter'] = [
            'class' => \yii\filters\Cors::class,
            'cors' => [
                'Origin' => ['http://localhost:3000'],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                'Access-Control-Allow-Credentials' => true,
                'Access-Control-Allow-Headers' => ['*'],
                'Access-Control-Expose-Headers' => ['*'],
            ],
        ];
        return $behaviors;
    }

    public function actionRegister()
    {
        $body = Yii::$app->request->bodyParams;
        $user = new User();
        $user->first_name = $body['firstName'] ?? null;
        $user->last_name = $body['lastName'] ?? null;
        $user->username = $body['username'] ?? null;
        $user->email = $body['email'] ?? null;
        $user->password_hash = password_hash($body['password'] ?? '', PASSWORD_DEFAULT);
        $user->confirmed = false;
        $user->auth_key = bin2hex(random_bytes(16));
        $user->confirmation_expires_at = date('Y-m-d H:i:s', time() + 300);
        $user->created_at = date('Y-m-d H:i:s');
        if (!$user->username || !$user->email || empty($body['password'])) {
            return ['success' => false, 'message' => 'Username, email, and password are required.'];
        }
        if (User::findByEmail($user->email)) {
            return ['success' => false, 'errors' => ['email' => ['This email is already registered.']]];
        }
        if (User::findOne(['username' => $user->username])) {
            return ['success' => false, 'errors' => ['username' => ['This username is already taken.']]];
        }
        if ($user->save(false)) {
            $emailSent = $this->sendConfirmationEmail($user);
            return [
                'success' => true,
                'message' => $emailSent
                    ? 'Registration successful. Check your email to confirm your account.'
                    : 'Registration successful, but the confirmation email could not be sent.',
                'confirmationToken' => $user->auth_key,
                'confirmationExpiresAt' => strtotime($user->confirmation_expires_at) * 1000,
                'emailSent' => $emailSent,
            ];
        }
        return ['success' => false, 'errors' => $user->errors];
    }

    public function actionResendConfirmation()
    {
        $email = Yii::$app->request->bodyParams['email'] ?? '';
        $user = User::findByEmail($email);
        if (!$user || $user->confirmed) {
            throw new BadRequestHttpException('No unconfirmed account was found for that email address.');
        }

        $user->auth_key = bin2hex(random_bytes(16));
        $user->confirmation_expires_at = date('Y-m-d H:i:s', time() + 300);
        $user->save(false);
        $emailSent = $this->sendConfirmationEmail($user);
        if (!$emailSent) {
            throw new BadRequestHttpException('The confirmation email could not be sent. Check the mail server configuration.');
        }

        return [
            'success' => true,
            'message' => 'A new confirmation email has been sent.',
            'confirmationExpiresAt' => strtotime($user->confirmation_expires_at) * 1000,
        ];
    }

    public function actionForgotPassword()
    {
        $identifier = trim(Yii::$app->request->bodyParams['identifier'] ?? '');
        $user = User::find()->where(['email' => $identifier])->orWhere(['username' => $identifier])->one();
        if (!$user) {
            throw new BadRequestHttpException('No account was found for that username or email.');
        }

        $user->password_reset_token = bin2hex(random_bytes(32));
        $user->password_reset_expires_at = date('Y-m-d H:i:s', time() + 300);
        $user->save(false);
        $emailSent = $this->sendPasswordResetEmail($user);
        if (!$emailSent) {
            throw new BadRequestHttpException('The password reset email could not be sent. Check the mail server configuration.');
        }

        return [
            'success' => true,
            'message' => 'A password reset link has been sent.',
            'resetExpiresAt' => strtotime($user->password_reset_expires_at) * 1000,
            'resetEmail' => $user->email,
        ];
    }

    public function actionRequestPasswordChange()
    {
        $body = Yii::$app->request->bodyParams;
        $authKey = $body['authKey'] ?? '';
        $currentPassword = $body['currentPassword'] ?? '';
        $newPassword = $body['newPassword'] ?? '';
        $confirmNewPassword = $body['confirmNewPassword'] ?? '';

        $user = User::findOne(['auth_key' => $authKey]);
        if (!$user) {
            throw new BadRequestHttpException('Invalid user credentials.');
        }
        if (!$user->validatePassword($currentPassword)) {
            throw new BadRequestHttpException('The current password is incorrect.');
        }
        if ($newPassword !== $confirmNewPassword) {
            throw new BadRequestHttpException('New passwords do not match.');
        }
        if (strlen($newPassword) < 8) {
            throw new BadRequestHttpException('New password must be at least 8 characters.');
        }

        $user->password_reset_token = bin2hex(random_bytes(32));
        $user->password_reset_expires_at = date('Y-m-d H:i:s', time() + 300);
        $user->save(false);

        $emailSent = $this->sendPasswordResetEmail(
            $user,
            'Confirm your password change',
            "Hello {$user->first_name},\n\n"
            . "Use this link to finish changing your TestSite password:\n"
            . rtrim(Yii::$app->params['frontendUrl'] ?? 'http://localhost:3000', '/')
            . '/reset-password/' . rawurlencode($user->password_reset_token)
            . "\n\n"
            . "This link expires in 5 minutes. If you did not request this change, you can ignore this email."
        );

        if (!$emailSent) {
            throw new BadRequestHttpException('The password change confirmation email could not be sent. Check the mail server configuration.');
        }

        return [
            'success' => true,
            'message' => 'A password change confirmation email has been sent.',
            'resetExpiresAt' => strtotime($user->password_reset_expires_at) * 1000,
            'resetEmail' => $user->email,
        ];
    }

    public function actionResetPassword()
    {
        $body = Yii::$app->request->bodyParams;
        $token = $body['token'] ?? '';
        $password = $body['password'] ?? '';
        $user = User::findOne(['password_reset_token' => $token]);
        if (!$user || !$user->password_reset_expires_at || strtotime($user->password_reset_expires_at) < time()) {
            throw new BadRequestHttpException('This reset link is invalid or expired.');
        }
        if (strlen($password) < 8) {
            throw new BadRequestHttpException('Password must be at least 8 characters.');
        }

        $user->password_hash = password_hash($password, PASSWORD_DEFAULT);
        $user->password_reset_token = null;
        $user->password_reset_expires_at = null;
        $user->save(false);
        return ['success' => true, 'message' => 'Password reset successful.'];
    }

    public function actionLogin()
    {
        $body = Yii::$app->request->bodyParams;
        $user = User::findByEmail($body['email'] ?? '');
        if (!$user || !$user->validatePassword($body['password'] ?? '')) {
            throw new BadRequestHttpException('Invalid credentials.');
        }
        return [
            'success' => true,
            'user' => [
                'id' => $user->id,
                'firstName' => $user->first_name,
                'lastName' => $user->last_name,
                'email' => $user->email,
                'confirmed' => $user->confirmed,
                'username' => $user->username,
                'authKey' => $user->auth_key,
                'profile_photo' => $user->profile_photo,
                'bio' => $user->bio,
                'phone' => $user->phone,
                'address' => $user->address,
                'social' => [
                    'linkedin' => $user->linkedin,
                    'twitter' => $user->twitter,
                    'facebook' => $user->facebook,
                    'instagram' => $user->instagram,
                ],
            ],
        ];
    }

    public function actionUpdateProfile()
    {
        $body = Yii::$app->request->bodyParams;
        $user = User::findOne(['auth_key' => $body['authKey'] ?? '']);
        if (!$user) {
            throw new BadRequestHttpException('Invalid user credentials.');
        }

        $user->first_name = $body['firstName'] ?? $user->first_name;
        $user->last_name = $body['lastName'] ?? $user->last_name;
        $user->username = $body['username'] ?? $user->username;
        $user->email = $body['email'] ?? $user->email;
        $user->phone = $body['phone'] ?? $user->phone;
        $user->address = $body['address'] ?? $user->address;
        $user->bio = $body['bio'] ?? $user->bio;
        $social = $body['social'] ?? [];
        $user->facebook = $social['facebook'] ?? $user->facebook;
        $user->twitter = $social['twitter'] ?? $user->twitter;
        $user->instagram = $social['instagram'] ?? $user->instagram;
        $user->linkedin = $social['linkedin'] ?? $user->linkedin;

        if (!$user->save()) {
            return ['success' => false, 'errors' => $user->errors];
        }

        return ['success' => true];
    }

    public function actionConfirm($token)
    {
        $user = User::findOne(['auth_key' => $token]);
        if (!$user || !$user->confirmation_expires_at || strtotime($user->confirmation_expires_at) < time()) {
            throw new BadRequestHttpException('Invalid or expired confirmation link. Please request a new one.');
        }
        $user->confirmed = true;
        $user->confirmation_expires_at = null;
        $user->save(false);
        return ['success' => true, 'message' => 'Account confirmed.'];
    }

    private function sendConfirmationEmail(User $user)
    {
        $frontendUrl = rtrim(Yii::$app->params['frontendUrl'] ?? 'http://localhost:3000', '/');
        $fromEmail = Yii::$app->params['mailFrom'] ?? 'no-reply@example.com';
        $confirmationUrl = $frontendUrl . '/confirm/' . rawurlencode($user->auth_key);
        $subject = 'Confirm your TestSite account';
        $body = "Hello {$user->first_name},\n\n"
            . "Check your email to confirm your TestSite account by opening this link:\n"
            . $confirmationUrl . "\n\n"
            . "This confirmation link expires in 5 minutes.\n\n"
            . "If you did not create this account, you can ignore this email.";
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
            $mailer->setFrom($fromEmail, Yii::$app->params['mailFromName'] ?? 'TestSite');
            $mailer->addAddress($user->email, trim($user->first_name . ' ' . $user->last_name));
            $mailer->Subject = $subject;
            $mailer->Body = $body;
            $mailer->send();
            return true;
        } catch (Exception $exception) {
            Yii::warning($exception->getMessage(), 'confirmation-mail');
            return false;
        }
    }

    private function sendPasswordResetEmail(User $user, $subject = null, $body = null)
    {
        $frontendUrl = rtrim(Yii::$app->params['frontendUrl'] ?? 'http://localhost:3000', '/');
        $fromEmail = Yii::$app->params['mailFrom'] ?? 'no-reply@example.com';
        $resetUrl = $frontendUrl . '/reset-password/' . rawurlencode($user->password_reset_token);
        $subject = $subject ?? 'Reset your TestSite password';
        $body = $body ?? ("Hello {$user->first_name},\n\n"
            . "Use this link to set a new TestSite password:\n"
            . $resetUrl . "\n\n"
            . "This link expires in 5 minutes. If you did not request this, you can ignore this email.");

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
            $mailer->setFrom($fromEmail, Yii::$app->params['mailFromName'] ?? 'TestSite');
            $mailer->addAddress($user->email, trim($user->first_name . ' ' . $user->last_name));
            $mailer->Subject = $subject;
            $mailer->Body = $body;
            $mailer->send();
            return true;
        } catch (Exception $exception) {
            Yii::warning($exception->getMessage(), 'password-reset-mail');
            return false;
        }
    }
}
