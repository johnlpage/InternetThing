Start an AWS host - I used a T3 small 2GB/2CPU 8GB Disk
allow 8281-8283 through

Install Mongosh

```
cat << 'ENDOFDOC' |  sudo tee /etc/yum.repos.d/mongodb-enterprise.repo
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
ENDOFDOC

sudo yum install -y mongodb-mongosh 
```


Regisster in DBS


curl --silent "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/registertrainingdns-kcqpc/service/webhook/incoming_webhook/register_with_owner?hostname=oademo.mdbtraining.net&ip=$(curl ifconfig.me)&secret=fluffypup&owner=john.page"


Install shellinabox
```
sudo mkdir -p /opt/shellinaboxd
cd /opt/shellinaboxd
sudo curl --silent -OL https://mdb-strigio.s3.eu-central-1.amazonaws.com/shellinaboxd
sudo chmod a+x /opt/shellinaboxd/shellinaboxd
```
Start
Mongosh endpoints

```

/opt/shellinaboxd/shellinaboxd -b -p 8281 --service=:ec2-user:ec2-user:HOME:'mongosh "mongodb+srv://demoview:testing123@internetthing2.tzfdn.mongodb.net/bledemo"'

/opt/shellinaboxd/shellinaboxd -b -p 8282 --service=:ec2-user:ec2-user:HOME:'mongosh "mongodb://archived-atlas-online-archive-618d29f61160e771b36cf8de-tzfdn.a.query.mongodb.net/bledemo" --tls --authenticationDatabase admin --username demoview --password testing123'

/opt/shellinaboxd/shellinaboxd -b -p 8283 --service=:ec2-user:ec2-user:HOME:'mongosh "mongodb://atlas-online-archive-618d29f61160e771b36cf8de-tzfdn.a.query.mongodb.net/bledemo" --tls --authenticationDatabase admin --username demoview --password testing123'

curl --silent "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/registertrainingdns-kcqpc/service/webhook/incoming_webhook/register_with_owner?hostname=oademo.mdbtraining.net&ip=$(curl ifconfig.me)&secret=fluffypup&owner=john.page"



```




Set these thins to happen on reboot too (TODO - ignore for now)
```
sudo chmod +x /etc/rc.d/rc.local

grep shellinaboxd /etc/rc.local  || echo "/opt/shellinaboxd/shellinaboxd -b -p 80 -s :SSH" | sudo tee --append /etc/rc.local

echo 'curl --silent "https://us-east-1.aws.webhooks.mongodb-stitch.com/api/client/v2.0/app/registertrainingdns-kcqpc/service/webhook/incoming_webhook/register_with_owner?hostname=oademo.mdbtraining.net&ip=$(curl ifconfig.me)&secret=fluffypup&owner=john.page" ' | sudo tee --append /etc/rc.local
```





