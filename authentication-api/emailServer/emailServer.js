const { MongoClient } = require('mongodb');
const schedule = require('node-schedule');
const axios = require('axios');
const nodemailer = require('nodemailer');

const uri = "mongodb://devs:qwert12345@172.16.10.244:27018/?authMechanism=DEFAULT";
const client = new MongoClient(uri);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "romulolyvio@gmail.com",
    pass: "bqxy safs fmns hgvr",
  },
});

const sendEmail = async (email, report) => {
    const mailOptions = {
      from: 'romulolyvio@gmail.com',
      to: email,
      subject: 'Scheduled Report',
      text: 'Here is your scheduled report.',
      attachments: [
        {
          filename: 'report.pdf',
          content: report,
        },
      ],
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}`); 
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  

const fetchAndEmailReport = async (url, email) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await sendEmail(email, response.data);
  } catch (error) {
    console.error('Error fetching or emailing report:', error);
  }
};

let scheduledJobs = [];

const cancelScheduledJobs = () => {
  scheduledJobs.forEach(job => job.cancel());
  scheduledJobs = [];
};

const scheduleTasks = async () => {
    try {
      await client.connect();
      const db = client.db('PreEngenharia');
      const scheduleCollection = db.collection('Schedule');
  
      const schedules = await scheduleCollection.find({}).toArray();
  
      cancelScheduledJobs();
  
      if (Array.isArray(schedules)) {
        schedules.forEach(doc => {
          if (Array.isArray(doc.MachineLHistory)) {
            doc.MachineLHistory.forEach(item => {
              const job = schedule.scheduleJob(item.schedule, () => {
                fetchAndEmailReport(`http://127.0.0.1:3005/api/generate-pdf/machine-lhistory/${item.user}`, item.email);
              });
              scheduledJobs.push(job);
            });
          }
  
          if (Array.isArray(doc.UsersLogged)) {
            doc.UsersLogged.forEach(item => {
              const job = schedule.scheduleJob(item.schedule, () => {
                fetchAndEmailReport(`http://127.0.0.1:3005/api/generate-pdf/users-logged/${item.machine}`, item.email);
              });
              scheduledJobs.push(job);
            });
          }
  
          if (Array.isArray(doc.OnlineDevices)) {
            doc.OnlineDevices.forEach(item => {
              const job = schedule.scheduleJob(item.schedule, () => {
                fetchAndEmailReport('http://127.0.0.1:3005/api/generate-pdf/online-devices', item.email);
              });
              scheduledJobs.push(job);
            });
          }
        });
      }
    } catch (error) {
      console.error('Error scheduling tasks:', error);
    }
  };
  

const updateScheduledTasks = async () => {
  console.log('Updating scheduled tasks...');
  await scheduleTasks();
};

setInterval(updateScheduledTasks, 20000); //20 segundos
updateScheduledTasks();