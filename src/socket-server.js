const net = require('net');
const { insertElement, getElement } = require('./db/database');

const HOST = '0.0.0.0';
const PORT = 6061;

const server = net.createServer((socket) => {
    const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Cliente conectado: ${clientAddr}`);

    socket.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`[${clientAddr}] Recibido: ${message}`);

        // Analizar el formato {insert:<element>} o {get:<element>}
        const match = message.match(/^\{(insert|get):(.+)\}$/);

        if (!match) {
            socket.write(JSON.stringify({ 
                statusCode: 400, 
                data: [], 
                message: 'Formato incorrecto. Use {insert:<element>} o {get:<element>}' 
            }) + '\n');
            return;
        }

        const command = match[1];
        const element = match[2].trim();

        if (command === 'insert') {
            try {
                const result = insertElement(element);
                socket.write(JSON.stringify({ 
                    statusCode: 200, 
                    data: result, 
                    message: 'Elemento insertado correctamente' 
                }) + '\n');
            } catch (err) {
                socket.write(JSON.stringify({ 
                    statusCode: 500, 
                    data: [], 
                    message: `Error al insertar: ${err.message}` 
                }) + '\n');
            }
        } else if (command === 'get') {
            try {
                const result = getElement(element);
                socket.write(JSON.stringify({ 
                    statusCode: 200, 
                    data: result, 
                    message: null 
                }) + '\n');
            } catch (err) {
                socket.write(JSON.stringify({ 
                    statusCode: 500, 
                    data: [], 
                    message: `Error al obtener: ${err.message}` 
                }) + '\n');
            }
        }
    });

    socket.on('end', () => {
        console.log(`Cliente desconectado: ${clientAddr}`);
    });

    socket.on('error', (err) => {
        console.error(`Error de socket: ${err.message}`);
    });
});

server.on('error', (err) => {
    console.error(`Error del servidor: ${err.message}`);
    process.exit(1);
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor Socket TCP escuchando en ${HOST}:${PORT}`);
});