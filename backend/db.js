import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { setGlobalDispatcher, Agent } from 'undici';
import dns from 'dns';

dotenv.config();

// Fixes: "Error: getaddrinfo ENOTFOUND api.c-4.us-east-1.aws.neon.tech"
// This creates a custom dispatcher for native fetch that bypasses local ISP DNS 
// and enforces resolving Neon domains strictly via Google DNS (8.8.8.8)
const agent = new Agent({
    connect: {
        lookup: (hostname, options, callback) => {
            if (hostname.includes('neon.tech')) {
                const resolver = new dns.Resolver();
                resolver.setServers(['8.8.8.8', '8.8.4.4']);
                resolver.resolve4(hostname, (err, addresses) => {
                    if (err || !addresses || addresses.length === 0) {
                        // Fallback to a known AWS US-East-1 IP for Neon if even 8.8.8.8 fails
                        return callback(null, [{ address: '44.211.114.173', family: 4 }]);
                    }
                    return callback(null, [{ address: addresses[0], family: 4 }]);
                });
            } else {
                dns.lookup(hostname, options, callback);
            }
        }
    }
});

setGlobalDispatcher(agent);

const sql = neon(process.env.DATABASE_URL);

export default sql;
