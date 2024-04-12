const axios = require("axios");
const readline = require("readline");
const fs = require("fs");

// Function to validate user input for country code
function validateCountryCode(code) {
  return code.length === 2 && code.match(/^[A-Za-z]+$/);
}

// Function to get proxy settings from user
function getProxy() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(
      "\x1b[36mEnter proxy (e.g., http://username:password@proxy_ip:proxy_port): \x1b[0m",
      (answer) => {
        rl.close();
        resolve({ http: answer, https: answer });
      }
    );
  });
}

const url = "http://www.insecam.org/en/jsoncountries/";

axios
  .get(url)
  .then((response) => {
    const countries = response.data.countries;

    console.log(`

\x1b[32m
  ██████╗░██╗░░░██╗██████╗░██╗░░░░░██╗░█████╗░  ░█████╗░░█████╗░███╗░░░███╗██╗░██████╗ ██╗░░██╗░█████╗░░█████╗░██╗░░██╗██╗███╗░░██╗░██████╗░
  ██╔══██╗██║░░░██║██╔══██╗██║░░░░░██║██╔══██╗  ██╔══██╗██╔══██╗████╗░████║╚█║██╔════╝ ██║░░██║██╔══██╗██╔══██╗██║░██╔╝██║████╗░██║██╔════╝░
  ██████╔╝██║░░░██║██████╦╝██║░░░░░██║██║░░╚═╝  ██║░░╚═╝███████║██╔████╔██║░╚╝╚█████╗░ ███████║███████║██║░░╚═╝█████═╝░██║██╔██╗██║██║░░██╗░
  ██╔═══╝░██║░░░██║██╔══██╗██║░░░░░██║██║░░██╗  ██║░░██╗██╔══██║██║╚██╔╝██║░░░░╚═══██╗ ██╔══██║██╔══██║██║░░██╗██╔═██╗░██║██║╚████║██║░░╚██╗
  ██║░░░░░╚██████╔╝██████╦╝███████╗██║╚█████╔╝  ╚█████╔╝██║░░██║██║░╚═╝░██║░░░██████╔╝ ██║░░██║██║░░██║╚█████╔╝██║░╚██╗██║██║░╚███║╚██████╔╝
  ╚═╝░░░░░░╚═════╝░╚═════╝░╚══════╝╚═╝░╚════╝░  ░╚════╝░╚═╝░░╚═╝╚═╝░░░░░╚═╝░░░╚═════╝░ ╚═╝░░╚═╝╚═╝░░╚═╝░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░╚══╝░╚═════╝░
                                                        \x1b[0m 
▄▀█ █░█ ▄▀█ █ █░░ ▄▀█ █▄▄ █░░ █▀▀   █▀▀ █▀█ █░█ █▄░█ ▀█▀ █▀█ █ █▀▀ █▀ ▀
█▀█ ▀▄▀ █▀█ █ █▄▄ █▀█ █▄█ █▄▄ ██▄   █▄▄ █▄█ █▄█ █░▀█ ░█░ █▀▄ █ ██▄ ▄█ ▄`);

    Object.keys(countries).forEach((code) => {
      // Mapping country code to flag symbol
      const flag = countryToFlag(code);
      console.log(
        `\x1b[33mCode : (${code}) ${flag} - ${countries[code].country} / (${countries[code].count})\x1b[0m`
      );
    });

    // Interactive mode to select country
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let country_code;
    const askCountryCode = () => {
      rl.question("\x1b[36mEnter country code (e.g., US): \x1b[0m", (answer) => {
        if (validateCountryCode(answer.toUpperCase())) {
          country_code = answer.toUpperCase();
          checkProxy();
        } else {
          console.log(
            "\x1b[31mInvalid country code. Please enter a valid 2-letter country code.\x1b[0m"
          );
          askCountryCode();
        }
      });
    };
    askCountryCode();

    function checkProxy() {
      rl.question("\x1b[36mDo you want to use a proxy? (yes/no): \x1b[0m", (answer) => {
        if (answer.toLowerCase().trim() === "yes") {
          getProxy().then((proxies) => {
            fetchData(proxies);
          });
        } else {
          fetchData();
        }
      });
    }
    function fetchData(proxy = null, page = 1, allIPs = new Set()) {
      const uniqueIPs = new Set(); // Set to store unique IP addresses

      // Delay fetching for 5 seconds
      setTimeout(() => {
        axios
          .get(
            `http://www.insecam.org/en/bycountry/${country_code}/?page=${page}`,
            { proxy }
          )
          .then((response) => {
            const ipRegex = /http:\/\/\d+\.\d+\.\d+\.\d+:\d+/g;
            const ips = response.data.match(ipRegex) || [];

            console.log(`\x1b[32mIP Addresses (Page ${page}):\x1b[0m`);
            ips.forEach((ip) => {
              // Check if IP address is not already present in the set of allIPs
              if (!allIPs.has(ip)) {
                // Check if IP address is not already present in the set of uniqueIPs
                if (!uniqueIPs.has(ip)) {
                  console.log(ip);
                  uniqueIPs.add(ip); // Add IP address to the set
                }
              }
            });

            allIPs = new Set([...allIPs, ...uniqueIPs]); // Merge unique IPs with allIPs

            // Write allIPs to file after fetching
            writeToFile(Array.from(allIPs), country_code);

            // Fetch next page recursively
            fetchData(proxy, page + 1, allIPs);
          })
          .catch((error) => {
            console.error("\x1b[31mAn error occurred:\x1b[0m", error.message);
            rl.close(); // Close readline interface if an error occurs
          });
      }, 5000); // 5 seconds delay
    }

    function writeToFile(ipAddresses, countryCode) {
      const outputFile = `${countryCode}_ip_addresses.txt`;
      fs.writeFile(outputFile, ipAddresses.join("\n"), (err) => {
        if (err) {
          console.error("\x1b[31mError writing to file:\x1b[0m", err);
        } else {
          console.log(
            `\x1b[32mIP addresses saved to ${outputFile}.\x1b[0m`
          );
        }
      });
    }
  })
  .catch((error) => {
    console.error("\x1b[31mAn error occurred:\x1b[0m", error.message);
  });

// Function to convert country code to flag symbol
function countryToFlag(isoCode) {
  const codePoints = isoCode
    .toUpperCase()
    .split('')
    .map(char => char.charCodeAt(0) + 127397);
  return String.fromCodePoint(...codePoints);
}
