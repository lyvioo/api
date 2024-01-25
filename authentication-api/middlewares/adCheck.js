const ActiveDirectory = require('activedirectory2');
const getAdConfig = require('../utilities/adConfig');  // Certifique-se de que o caminho está correto

const authenticateAD = async (username, password) => {
    try {
        console.log(`[INFO] Iniciando autenticação para o usuário: ${username}`);

        const adConfig = await getAdConfig();
        if (!adConfig) {
            throw new Error('Não foi possível obter as configurações do AD');
        }

        const ad = new ActiveDirectory(adConfig);
        const fullUsername = `${username}@${adConfig.domain}`;

        return new Promise((resolve, reject) => {
            ad.authenticate(fullUsername, password, async function(err, auth) {
                if (err) {
                    console.error(`[ERROR] Erro durante a autenticação do usuário ${username}:`, err.message);
                    return reject({ status: 500, message: 'Internal Server Error' });
                } 
                if (auth) {
                    ad.getGroupMembershipForUser(fullUsername, function(err, groups) {
                        if (err) {
                            console.error(`[ERROR] Erro ao obter grupos para o usuário ${username}:`, err.message);
                            return reject({ status: 500, message: 'Internal Server Error' });
                        }

                        const userGroups = groups.map(group => group.cn);
                        const allowedGroups = adConfig.allowedGroupName;

                        const isMemberOfAllowedGroup = userGroups.some(group => allowedGroups.includes(group));

                        if (isMemberOfAllowedGroup) {
                            ad.findUser(fullUsername, function(err, user) {
                                if (err) {
                                    console.error(`[ERROR] Erro ao obter detalhes do usuário ${username}:`, err.message);
                                    return reject({ status: 500, message: 'Internal Server Error' });
                                }
                                if (!user) {
                                    console.warn(`[WARNING] Usuário ${username} não encontrado`);
                                    return reject({ status: 404, message: 'User not found' });
                                }
                                console.log(`[INFO] Usuário ${username} autenticado com sucesso`);
                                return resolve({ status: 200, message: 'Authentication successful', displayName: user.displayName });
                            });
                        } else {
                            console.warn(`[WARNING] Usuário ${username} não é membro de nenhum grupo permitido`);
                            return reject({ status: 403, message: 'User not a member of allowed groups' });
                        }
                    });
                } else {
                    console.warn(`[WARNING] Falha na autenticação para o usuário ${username}`);
                    return reject({ status: 401, message: 'Authentication failed' });
                }
            });
        });
    } catch (err) {
        console.error('[ERROR] Error in authenticateAD:', err.message);
        throw { status: 500, message: 'Internal Server Error' };
    }
};

module.exports = {
    authenticateAD
};
