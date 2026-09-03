cd "C:\xampp\htdocs\THESIS\OJT-Test"

git branch -M main
git remote add origin https://github.com/bscslhp15/OJT-Test.git
git push -u origin main


(ung git status ung magpapakita lahat ng modified bagong file at deleted file)
cd "C:\xampp\htdocs\THESIS\OJT-Test"

git status
git diff --stat
git add .
git diff --cached --stat
git commit -m "Update system"
git push

cd "C:\xampp\htdocs\THESIS\OJT-Test"
git add .
git commit -m "Update system"
git push

git clone https://github.com/bscslhp15/OJT-Test.git