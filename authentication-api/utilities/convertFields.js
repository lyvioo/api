function convertFields(item) {
    let newItem = {};

    Object.keys(item).forEach(key => {
        const value = item[key];

        if (key === 'architecture') {
            // Converte o valor para string e adiciona 'x' se necessário
            let architectureValue = String(value);
            if (!architectureValue.startsWith('x')) {
                newItem[key] = 'x' + architectureValue;
            } else {
                newItem[key] = architectureValue;
            }
        }else{
        if (typeof value === 'string') {
            if (value.includes('%')) {
                // Converte para float e remove o símbolo de porcentagem
                newItem[key] = parseFloat(value.replace('%', ''));
            } else if (value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
                // Adiciona 'Z' no final se for uma data no formato 'YYYY-MM-DD HH:MM:SS'
                newItem[key] = value + 'Z';
            } else if (!isNaN(value)) {
                // Converte string numérica para float ou int
                newItem[key] = value.includes('.') ? parseFloat(value) : parseInt(value, 10);
            } else {
                // Mantém como string
                newItem[key] = value;
            }
        } else {
            // Mantém o valor original se não for uma string
            newItem[key] = value;
        }
}});

    return newItem;
}

module.exports = convertFields;
