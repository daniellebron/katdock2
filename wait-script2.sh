clear

GREEN='\033[1;32m'
NC='\033[0m'

echo -e "${GREEN}---------------------------------------------------------------"
echo -e "                     LOADING KODEKLOUD"
echo -e "---------------------------------------------------------------"
echo -e ""
echo -e "Please wait while the test environment is setup. It may take up to 5 minutes."
echo -e ""
echo -e ""
echo -e "Setting up Test Environment ..."
until $(curl --output /dev/null --silent --head --fail http://host01:8080); do
    printf '.'
    sleep 1
done

clear

# echo -e "      Click on the ^^^ Quiz Portal tab above to open your quiz console"
echo -e "    "
echo -e "                     ALL SET!${NC}"


rm /tmp/wait-script.sh