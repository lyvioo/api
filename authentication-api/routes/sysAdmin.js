const express = require('express');
const router = express.Router();
const removeUnwantedFields = require('../utilities/removeFields').removeUnwantedFields;
const convertFields = require('../utilities/convertFields');
const convertUnixToDate = require('../utilities/convertUnixTimeStamp');
const tokenCheck = require('../middlewares/tokenCheck');
const adminCheck = require('../middlewares/adminCheck');

router.get('/sysadmin/summary/:hostname', tokenCheck, adminCheck, async (req, res) => {
  try {
    const hostname = req.params.hostname;

    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('Inventory');

    const query = {'system_info.hostname': {$regex: new RegExp('^' + hostname + '$', 'i')}};
    const doc = await collection.findOne(query);

    if (doc) {
        let summary = {};

        let isOnline = false;
      if (doc.last_update) {
          const lastUpdate = new Date(doc.last_update);
          const now = new Date();
          const twoMinutesAgo = new Date(now.getTime() - (2 * 60 * 1000)); // Data e hora de 2 minutos atrás

          isOnline = lastUpdate >= twoMinutesAgo;
          summary.status = isOnline ? 'Online' : 'Offline';
      } else {
          summary.status = 'Status Unknown';
      }

        // 1. Uso médio da CPU
        if (isOnline && Array.isArray(doc.cpu) && doc.cpu.length > 0) {
          const totalUsage = doc.cpu.reduce((acc, cpu) => {
              const usage = parseFloat(cpu.usage_percent.replace('%', ''));
              return acc + (isNaN(usage) ? 0 : usage);
          }, 0);
          summary.cpu_usage = totalUsage / doc.cpu.length;
      } else {
        summary.cpu_usage = 0;
    }

        // 2. Uso da Memória
        if (isOnline && Array.isArray(doc.memory_devices) && doc.memory_devices.length > 0) {
          const totalMemoryGB = parseFloat(doc.memory_devices.reduce((acc, mem) => acc + (Number(mem.size_gb) || 0), 0).toFixed(2));
          const usedMemoryGB = parseFloat(doc.memory_devices.reduce((acc, mem) => acc + (Number(mem.usage_gb) || 0), 0).toFixed(2));
          const memoryUsagePercent = parseFloat(((usedMemoryGB / totalMemoryGB) * 100).toFixed(2));

          summary.memory_usage = memoryUsagePercent; 
          summary.memory_usage_string = `${usedMemoryGB} GB (${memoryUsagePercent}%) of ${totalMemoryGB} GB used`;
      } else {
        summary.memory_usage = 0; 
        summary.memory_usage_string = '0 GB (0%) of 0 GB used';
    }

      // 3. Uso de Disco
      if (isOnline && Array.isArray(doc.disk_info) && doc.disk_info.length > 0) {
        const totalDiskSizeGB = parseFloat(doc.disk_info.reduce((acc, disk) => acc + (Number(disk.disk_size_gb) || 0), 0).toFixed(2));
          const totalFreeDiskGB = parseFloat(doc.disk_info.reduce((acc, disk) => acc + (Number(disk.free_gb) || 0), 0).toFixed(2));
          const usedDiskGB = parseFloat((totalDiskSizeGB - totalFreeDiskGB).toFixed(2));
          const diskUsagePercent = parseFloat(((usedDiskGB / totalDiskSizeGB) * 100).toFixed(2));

          summary.disk_usage = diskUsagePercent;
          summary.disk_usage_string = `${usedDiskGB} GB (${diskUsagePercent}%) of ${totalDiskSizeGB} GB used`;
      } else {
        summary.disk_usage = 0;
        summary.disk_usage_string = '0 GB (0%) of 0 GB used';
    }  

      // Extrair Uptime
      if (doc.last_update) {
        const lastUpdate = new Date(doc.last_update);
        summary.last_seen = lastUpdate.toISOString(); // Formatar como string ISO

        const now = new Date();
        const twoMinutesAgo = new Date(now.getTime() - (2 * 60 * 1000)); // Data e hora de 2 minutos atrás

        const isOnline = lastUpdate >= twoMinutesAgo;
        summary.status = isOnline ? 'Online' : 'Offline';
        summary.uptime = isOnline && Array.isArray(doc.system_uptime) && doc.system_uptime.length > 0
            ? doc.system_uptime[0].uptime
            : 0;
    } else {
        summary.status = 'Status Unknown';
        summary.uptime = 0;
        summary.last_seen = 'Data not available';
    }

    if (Array.isArray(doc.os_informations) && doc.os_informations.length > 0) {
      // Supondo que você esteja interessado no primeiro elemento do array
      const operationalSystem = doc.os_informations[0].name;
      summary.operational_system = operationalSystem;
  } else {
      summary.operational_system = 'OS information not available';
  }

  if (doc.timestamp) {
    const agentEnrolledDate = new Date(doc.timestamp);
    summary.agent_enrolled = agentEnrolledDate.toISOString();
} else {
    summary.agent_enrolled = 'Enrollment date not available';
}

        if (Object.keys(summary).length > 0) {
            res.json({ "summary": summary });
        } else {
            res.status(404).json({ message: "Summary data not found" });
        }
    } else {
        res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/sysadmin/hardware/:hostname', tokenCheck, adminCheck, async (req, res) => {
  try {
      const hostname = req.params.hostname;

      const dbEngenharia = await req.app.locals.dbEngenhariaTest;
      const db = dbEngenharia.db('PreEngenharia');
      const collection = db.collection('Inventory');

      const query = {'system_info.hostname': {$regex: new RegExp('^' + hostname + '$', 'i')}};
      const doc = await collection.findOne(query);

      if (doc) {
          let processCount = doc.processes && Array.isArray(doc.processes) ? doc.processes.length : 0;

          let cpuData, videoData, memoryData, diskData, motherboardData, mountData;

          if (doc.cpu) {
              cpuData = doc.cpu.map(item => ({
                  ...convertFields(item),
                  processes_count: processCount
              }));
          }

          if (doc.video_info) {
              videoData = doc.video_info.map(item => {
                  if (item.driver_date) {
                      item.driver_date = convertUnixToDate(item.driver_date);
                  }
                  return convertFields(item);
              });
          }

          if (doc.memory_devices){
              memoryData = doc.memory_devices.map(item => convertFields(item));
          }

          if (doc.hds_info){
              diskData = doc.hds_info.map(item => convertFields(item));
          } else if (doc.mount_info) {
              mountData = doc.mount_info.map(item => convertFields(item));
          }

          if (doc.motherboard_info){
              motherboardData = doc.motherboard_info.map(item => convertFields(item));
          }

          if (doc.network_interfaces){
              networkData = doc.network_interfaces.map(item => convertFields(item));
          }

          let hardware = {};
          if (cpuData) hardware.cpuInfo = cpuData;
          if (videoData) hardware.videoInfo = videoData;
          if (memoryData) hardware.memoryInfo = memoryData;
          if (diskData) hardware.diskInfo = diskData;
          if (mountData) hardware.mountInfo = mountData;
          if (motherboardData) hardware.motherboardInfo = motherboardData;
          if (networkData) hardware.networkInfo = networkData;


          if (Object.keys(hardware).length > 0) {
              res.json({ "hardware": hardware });
          } else {
              res.status(404).json({ message: "Hardware data not found" });
          }
      } else {
          res.status(404).json({ message: "Document not found" });
      }
  } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/sysadmin/operational_system/:hostname', tokenCheck, async (req, res) => {
    try {
      const hostname = req.params.hostname;
  
      const dbEngenharia = await req.app.locals.dbEngenhariaTest;
      const db = dbEngenharia.db('PreEngenharia');
      const collection = db.collection('Inventory');
  
      const query = {'system_info.hostname': {$regex: new RegExp('^' + hostname + '$', 'i')}};
      const doc = await collection.findOne(query);
  
      if (doc) {
          let data;
  
          // Verificando qual array está disponível
          if (doc.programs) {
              data = doc.programs;
          } else if (doc.rpm_packages) {
              data = doc.rpm_packages;
          } else if (doc.deb_packages) {
              data = doc.deb_packages;
          }
  
          if (data) {
              const modifiedData = data.map(item => removeUnwantedFields(item));
  
              res.json(modifiedData);
          } else {
              res.status(404).json({ message: "No relevant data found" });
          }
      } else {
          res.status(404).json({ message: "Document not found" });
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  router.get('/sysadmin/security/:hostname', tokenCheck, adminCheck, async (req, res) => {
    try {
        const hostname = req.params.hostname;

        const dbEngenharia = await req.app.locals.dbEngenhariaTest;
        const db = dbEngenharia.db('PreEngenharia');
        const collection = db.collection('Inventory');

        const query = {'system_info.hostname': {$regex: new RegExp('^' + hostname + '$', 'i')}};
        const doc = await collection.findOne(query);

        if (doc) {
            let etcData = doc.etc_hosts ? doc.etc_hosts.map(item => convertFields(item)) : [];
            let uacData = doc.uac_info ? doc.uac_info.map(item => convertFields(item)) : [];
            let firewallLogData = doc.firewall_log_path ? doc.firewall_log_path.map(item => convertFields(item)) : [];
            let firewallConfigData = doc.firewall_config_info ? doc.firewall_config_info.map(item => convertFields(item)) : [];
            let firewallRulesData = doc.firewall_rules ? doc.firewall_rules.map(item => convertFields(item)) : [];
            let usersData = doc.user_groups ? doc.user_groups.map(item => convertFields(item)) : [];
            let groupsData = doc.groups ? doc.groups.map(item => {
                const { gid_signed, ...rest } = item;
                return convertFields(rest);
            }) : [];
            let loginHistoryData = doc.login_history ? doc.login_history.map(item => {
                const { computer_name, ...rest } = item;
                return rest;
            }) : [];
            let loggedUsersData = doc.logged_in_users ? doc.logged_in_users.map(item => {
              const { type, ...rest } = item;
              return convertFields(rest);
          }) : [];
          

            let security = {
                etcInfo: etcData,
                uacInfo: uacData,
                firewallLogInfo: firewallLogData,
                fireawallConfigInfo: firewallConfigData,
                firewallRulesInfo: firewallRulesData,
                usersInfo: usersData,
                groupsInfo: groupsData,
                loginHistoryInfo: loginHistoryData,
                loggedUsersInfo: loggedUsersData
            };

            if (Object.keys(security).some(key => security[key].length > 0)) {
                res.json({ "security": security });
            } else {
                res.status(404).json({ message: "Security data not found" });
            }
        } else {
            res.status(404).json({ message: "Document not found" });
        }
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

  
router.get('/sysadmin/processes/:hostname', tokenCheck, adminCheck, async (req, res) => {
  try {
    const hostname = req.params.hostname;

    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('Inventory');

    const query = {'system_info.hostname': {$regex: new RegExp('^' + hostname + '$', 'i')}};
    const doc = await collection.findOne(query);

    if (doc) {
      let processesData

      if (doc.processes){
        // Nomes e data proibidos
        const forbiddenNames = ['datadike.exe', 'datadike', 'dikequeryi.exe', 'dikequeryi'];
        const forbiddenDate = "1969-12-31T23:59:59Z";

        // Filtrando processos
        processesData = doc.processes.filter(processItem => {
          return !forbiddenNames.includes(processItem.name.toLowerCase()) &&
                 processItem.execution_time !== forbiddenDate;
        }).map(convertFields);
      }


        let processes = {};
        if (processesData) {
            processes.proceces = processesData;
        }

        if (Object.keys(processes).length > 0) {
            res.json({ "processes": processes });
        } else {
            res.status(404).json({ message: "Processes data not found" });
        }
    } else {
        res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/sysadmin/services/:hostname', tokenCheck, adminCheck, async (req, res) => {
  try {
    const hostname = req.params.hostname;

    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('Inventory');

    const query = {'system_info.hostname': {$regex: new RegExp('^' + hostname + '$', 'i')}};
    const doc = await collection.findOne(query);

    if (doc) {
      let servicesData

        if (doc.services){
          servicesData = doc.services.map(item => convertFields(item));
        }


        let services = {};
        if (servicesData) {
            services.services = servicesData;
        }

        if (Object.keys(services).length > 0) {
            res.json({ "services": services });
        } else {
            res.status(404).json({ message: "Processes data not found" });
        }
    } else {
        res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/sysadmin/asset/:hostname', tokenCheck, adminCheck, async (req, res) => {
  try {
    const hostname = req.params.hostname;

    const dbEngenharia = await req.app.locals.dbEngenhariaTest;
    const db = dbEngenharia.db('PreEngenharia');
    const collection = db.collection('Inventory');

    const query = {'system_info.hostname': {$regex: new RegExp('^' + hostname + '$', 'i')}};
    const doc = await collection.findOne(query);

    if (doc) {
      let loggedUsersData

        if (doc.logged_in_users){
          loggedUsersData = doc.logged_in_users.map(item => convertFields(item));
        }

        if (doc.users){
          usersData = doc.users.map(item => convertFields(item));
        }

        if (doc.groups){
          groupsData = doc.groups.map(item => convertFields(item));
        }


        let users = {};
        if (loggedUsersData) {
            users.loggedInUsersInfo = loggedUsersData;
            users.usersInfo = usersData;
            users
        }

        if (Object.keys(users).length > 0) {
            res.json({ "users": users });
        } else {
            res.status(404).json({ message: "Processes data not found" });
        }
    } else {
        res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;

