#!/bin/bash

# Sets the Cache Control header with a max age for all files in specified blob storage container.
# https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control

# Usage ./updateblob.sh <storage-account-name> <storage-account-key> <container-name> <max-age>
# Example

# Parameters
STORAGE_ACCOUNT_NAME=$0
STORAGE_ACCOUNT_KEY=$1
CONTAINER_NAME=$2
MAX_AGE=$3

# Variables
connString="DefaultEndpointsProtocol=https;AccountName=$STORAGE_ACCOUNT_NAME;AccountKey=$STORAGE_ACCOUNT_KEY"
cacheControl="public, max-age=$MAX_AGE"

#list all files currently in blob
az storage blob list -c $CONTAINER_NAME --connection-string $connString --num-results 10000 -o json | jq -r '.[] | {name} | .name' > tmp.txt

##ADD IN COUNT FOR INDEX ARRAY
echo "Starting Azure Storage blob file update. This will take some time..."

while read p; do 
    az storage blob update --connection-string $connString --container-name $CONTAINER_NAME -n $p --content-cache-control "$cacheControl" > /dev/null
   
   if [ $? -eq 0 ];then 
        echo "$p has been updated with the following blob properties: --content-cache-control $cacheControl"
    else 
        echo "There was an error. Please try again."
    fi
done < tmp.txt

#cleanup
rm tmp.txt
