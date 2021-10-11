public with sharing class prism_ganttChartCtrlr {
    /*
    What we need for input
    @api inputFields = [
    {
      label: "Name",
      api: "Name",
      value: "",
      maxLength: 80,
      minLength: 0,
      isRequired: true,
      key: "farLookupNewName",
      type: "text",
      display:false,
    },
recordId
startTime
endTime
slotSize
filterProjects
filterRoles
filterStatus
allocatedItemApiName
projectApiName
allocatedItemFieldsToQuery
projectFieldsToQuery
junctionFieldsToQuery
junctionObjectApiName
orderBy
filterStringToGetResources
filterStringToGetProjects
allocatedItemSubHeader
objectForView
startDateFieldApi
endDateFieldApi
filterString
projectsToFilter
projectFieldApiName
allocationItemsToFilter
allocatedItemFieldApiName
junctionRecordsToFilter
junctionFieldToFilter





    */
    @AuraEnabled
    public static Map<String, Object> getChartData(String inputJSON) {
        Map<String, Object> mapValues = (Map<String, Object>) JSON.deserializeUntyped(inputJSON);
        map<string,string> inputMap= new Map<string,string>();
        
        for(String strKey: mapValues.keyset())
        {
            inputMap.put(strKey, String.valueof(mapValues.get(strKey)));
        }
        Map<String, Object> data = new Map<String, Object>();
        List<String> itemfields = new List<String>();
        List<String> projectfields = new List<String>();
        String recordId= inputMap.get('recordId');
        String endDatestr=(String)inputMap.get('endTime').trim();
        String startDatestr=(String)inputMap.get('startTime').trim();
		Integer slotSize=Integer.valueOf(inputMap.get('slotSize'));
        
        List<Object> allocations = new List<Object>();
        Map<String, Object> projectById = new Map<String, Object>();
        Map<String, Object> resourceById = new Map<String, Object>();
        Set<String> itemAdditionalInfo = new Set<String>();

        String query = 'SELECT ';
        String filter='';
        String itemObj = inputMap.get('allocatedItemFieldApiName').replace('__c','__r');
        String projObj = inputMap.get('projectFieldApiName').replace('__c','__r');
        if(String.isNotBlank(inputMap.get('allocatedItemFieldsToQuery'))){
            itemfields = inputMap.get('allocatedItemFieldsToQuery').split(',');
            for(String itemfield: itemfields){
                query =query +itemObj+'.'+itemfield+',';
            }
        }
        if(String.isNotBlank(inputMap.get('projectFieldsToQuery'))){
            projectfields = inputMap.get('projectFieldsToQuery').split(',');
            for(String projectfield: projectfields){
                query =query +projObj+'.'+projectfield+',';
            }
        }
        Date startDate = DateTime.newInstance(Long.valueOf(startDatestr)).date();
        Date endDate = DateTime.newInstance(Long.valueOf(endDatestr)).date();
        query =String.isNotBlank(inputMap.get('junctionFieldsToQuery')) ? (query+ inputMap.get('junctionFieldsToQuery')):query;
        query=(query.right(1)==',')? query.substring((query.length())-2): query;
        query = String.isNotBlank(inputMap.get('junctionObjectApiName')) ? query+' FROM '+inputMap.get('junctionObjectApiName') : query;
        filter = filter +' WHERE '+ inputMap.get('startDateFieldApi')+' <=:  endDate'+' AND '+inputMap.get('endDateFieldApi')+' >=:  startDate';
        filter = String.isNotBlank(inputMap.get('filterString')) ? filter +' And ( '+inputMap.get('filterString')+' )':filter;
        filter =String.isNotBlank(inputMap.get('projectsToFilter')) ? filter +' AND '+inputMap.get('projectFieldApiName')+' IN :' + (inputMap.get('projectsToFilter').split(',')): filter;
        filter =String.isNotBlank(inputMap.get('allocationItemsToFilter')) ? filter +' AND '+inputMap.get('allocatedItemFieldApiName')+' IN ' + (inputMap.get('allocationItemsToFilter').split(',')): filter;
        filter =String.isNotBlank(inputMap.get('junctionRecordsToFilter')) ? filter +' AND '+inputMap.get('junctionFieldToFilter')+' IN ' + (inputMap.get('junctionRecordsToFilter').split(',')): filter;
        system.debug('@!filter '+filter);
       	query= String.isNotBlank(filter) ? (query+filter):query;
        /*
            SObjectType obj = Schema.getGlobalDescribe().get(startDateFieldApi);
            SObject objMap = obj.newSObject();
            //Map<String,Schema.SObjectField> mfields = obj.getDescribe().fields.getMap();
            for(newRecordWrapper inputField:inputFields){
                //Schema.DisplayType fielddataType =mfields.get(inputField.api).getDescribe().getType();
                objMap.put(inputField.api,inputField.value);
            }
        */
        
        if (String.isNotEmpty( endDatestr) &&  String.isNotEmpty( startDatestr)) {
            
            Integer days = startDate.daysBetween(endDate) + 1;
            Decimal slots = days / slotSize;
            
            // Overview View
            if (String.isEmpty(recordId)) {
                query += inputMap.get('orderBy');
                System.debug(query);
                System.debug(endDatestr);
                System.debug(startDatestr);
                System.debug(slotSize);
                allocations = (list<object>) Database.query(query);

                // display all active resources
                for (Object r : getResources(inputMap.get('allocatedItemFieldsToQuery'),  inputMap.get('allocatedItemApiName'), inputMap.get('filterStringToGetResources') )) {
                    Map<String, Object> resource = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(r));
                    resource.put('allocationsByProject',(object) new Map<String, Object>());
                    resourceById.put((String) resource.get('Id'), (object) resource);
                    itemAdditionalInfo.add((String)resource.get(inputMap.get('allocatedItemSubHeader')));
                    System.debug('display all active resources'+itemAdditionalInfo);
                }
            } else {
                if (inputMap.get('objectForView').containsIgnoreCase(inputMap.get('projectApiName'))) {
                    data.put('projectId', recordId);
                }
                if(String.isNotBlank(recordId) && (inputMap.get('objectForView').containsIgnoreCase(inputMap.get('allocatedItemFieldApiName')) || inputMap.get('objectForView').containsIgnoreCase(inputMap.get('projectApiName')))){
                    String filter2='';
                    filter2=(String.isNotBlank(filter))? (filter2+' AND (') : filter2+' WHERE ';
                    filter2 += inputMap.get('projectFieldApiName')+' = '+'\''+recordId+'\''+ ' OR '+inputMap.get('allocatedItemFieldApiName')+' = '+'\''+recordId+'\'';
                    filter2=(String.isNotBlank(filter))? (filter2+')') : filter2;
                    query= String.isNotBlank(filter2) ? (query+filter2):query;
                }
                    
                allocations = (list<object>) Database.query(query);
                //
                if (allocations.isEmpty()){
                    // on resource page
                    if (inputMap.get('objectForView').containsIgnoreCase(inputMap.get('allocatedItemApiName'))) {
                         Map<String, Object> firstAllocation= (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(allocations[0]));
                        list<object> lsObj = getResourceById(inputMap.get('allocatedItemFieldsToQuery'),  inputMap.get('allocatedItemApiName'), String.valueOf(firstAllocation.get(inputMap.get('allocatedItemFieldApiName'))));
                        for (object r : lsObj) {
                            Map<String, Object> resource = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(r));
                            resource.put('allocationsByProject',(object) new Map<String, Object>());
                            resourceById.put((String)resource.get('Id'), (object)r);
                            itemAdditionalInfo.add((String)resource.get(inputMap.get('allocatedItemSubHeader')));
                        }
                    }
                    
                }
                
            }
            
            // organize allocations by resource and project
            for (object alctn : allocations) {
                Map<String, Object> allocation= (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(alctn));
                
                 //get record id of project
                String tempal_P = (String) allocation.get(inputMap.get('projectFieldApiName'));
                String tempal_A = (String) allocation.get(inputMap.get('allocatedItemFieldApiName'));
                if (!resourceById.containsKey(tempal_A)) {
                    Map<String, Object> resource = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(allocation.get(inputMap.get('allocatedItemFieldApiName').replace('__c','__r'))));
                    resource.put('allocationsByProject',(object) new Map<String, Object>());
                    resourceById.put(tempal_A, (object)resource);
                }
				Map<String, Object> chkResource = (Map<String, Object>)resourceById.get(tempal_A);
                Map<String, Object> allocationsByProject = (Map<String, Object>)chkResource.get('allocationsByProject');
                if (!allocationsByProject.containsKey(tempal_P)) {
                    allocationsByProject.put(tempal_P, new List<Object>());
                }
				String P_name=(String) ((Map<String, Object>) allocation.get(inputMap.get('projectFieldApiName').replace('__c','__r'))).get('Name');
                projectById.put(tempal_P, new Map<String, Object> {
                    'Id' => tempal_P,
                    'Name' => P_name
                });
                allocation.put('projectName',P_name);
                List<Object> projectAllocation = (List<Object>)allocationsByProject.get(tempal_P);
                Integer strt = startDate.daysBetween( (Date.valueOf(String.valueOf(allocation.get(inputMap.get('startDateFieldApi'))))));
                Integer enddt = startDate.daysBetween((Date.valueOf(String.valueOf(allocation.get(inputMap.get('endDateFieldApi'))))));
                Decimal left = Decimal.valueOf(strt) / slotSize;
                left = left.round(System.RoundingMode.FLOOR);
                allocation.put('left',(object) left);
                
                Decimal right = Decimal.valueOf(enddt) / slotSize;
                right = right.round(System.RoundingMode.FLOOR);
                allocation.put('right',(object) right);
                projectAllocation.add(new Map<String, Object>(allocation));
            }
        }

        data.put('projects', projectById.values());
        data.put('allocatedItems', resourceById.values());
        data.put('allocatedItemSubHeaderValues', itemAdditionalInfo);
        
        return data;
    }
    @AuraEnabled
    public static List<object> getResources(String queryFields, String allocatedItemApiName, String filterStringToGetResources) {
        String queryStart=prism_ganttChartUtil.getQueryStartString(queryFields);
        String query =queryStart+ queryFields+' FROM '+allocatedItemApiName;
        query= String.isNotBlank(filterStringToGetResources)?query+' WHERE '+ filterStringToGetResources+' ORDER BY Name':query+' ORDER BY Name';
        return (List<Object>) Database.query(query);
    }
    @AuraEnabled
    public static String getFieldsString(String recordId, String currentObject, String fieldToQueryString){
        String retVal='';
        String query = 'SELECT '+fieldToQueryString+' FROM '+currentObject+'WHERE Id= '+'\''+recordId+'\''+ ' LIMIT 1';
        list<object> qResults= (list<object>)  Database.query(query);
        Map<String, Object> qResult= (Map<String, Object>) qResults[0];
        if(qResult!= null && qResult.get(fieldToQueryString)!= null){
            retVal= JSON.serialize(qResult);
        }
        return retVal;
    }
    @AuraEnabled
    public static Boolean saveFieldsString(String recordId, String currentObject, String fieldToQuery, String fieldString){
        Boolean retVal=true;
        try{
            SObjectType obj = Schema.getGlobalDescribe().get(currentObject);
            SObject objMap = obj.newSObject();
            objMap.put('Id',(object)recordId);
            objMap.put(fieldToQuery,(object)fieldString);
            upsert objMap;
        } catch (Exception e) {
            retVal=false;
        }
        return retVal;
    }
    
    public static List<object> getResourceById(String queryFields, String allocatedItemApiName, String recordId) {
        String queryStart=prism_ganttChartUtil.getQueryStartString(queryFields);
        String query =queryStart+ queryFields+' FROM '+allocatedItemApiName;
        query= String.isNotBlank(recordId)?query+' WHERE id='+'\''+ recordId+'\'' : query;
        System.debug('resourceById query '+query);
        return (List<Object>) Database.query(query);
    }
    @AuraEnabled
    public static List<object> getProjects(String queryFields, String projectApiName, String filterStringToGetProjects) {
        String queryStart=prism_ganttChartUtil.getQueryStartString(queryFields);
        String query =queryStart+ queryFields+' FROM '+projectApiName;
        query= String.isNotBlank(filterStringToGetProjects)?query+' WHERE '+ filterStringToGetProjects+' ORDER BY Name':query+' ORDER BY Name';
        return (List<Object>) Database.query(query);
    }


    @AuraEnabled
    public static void saveAllocation(String junctionObjectApiName, list<Map<String,Object>> inputFields) {
        SObjectType obj = Schema.getGlobalDescribe().get(junctionObjectApiName);
        SObject objMap = obj.newSObject();
        for(Map<String,Object> inputField:inputFields){
            if(((String)inputField.get('type')).containsIgnoreCase('Date')){
                inputField.put('value',(object) DateTime.newInstance(Long.valueOf((String)inputField.get('value'))).date());
            }else if(((String)inputField.get('type')).containsIgnoreCase('Id')){
                objMap.put((String) inputField.get('api'),inputField.get('value'));
            }
            objMap.put((String) inputField.get('api'),inputField.get('value'));
        }
        
        upsert objMap;
    }

    @AuraEnabled
    public static void deleteAllocation(String junctionObjectApiName, String allocationId, String projectId, String allocatedItemId,String projectFieldApiName,String allocatedItemFieldApiName) {
        SObjectType obj = Schema.getGlobalDescribe().get(junctionObjectApiName);
        SObject objMap = obj.newSObject();
        String recId=allocationId;
        if(String.isBlank(recId)){
            String query ='SELECT Id FROM '+junctionObjectApiName+' WHERE '+ projectFieldApiName+' = \''+ projectId+'\' AND '+allocatedItemFieldApiName+' = \''+ allocatedItemId+'\' LIMIT 1';
        	List<Object> lsObjs= (List<Object>) Database.query(query);
            for (object r : lsObjs) {
                Map<String, Object> lsObj = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(r));
                recId=(String)lsObj.get('Id');
            }
        }
        objMap.put('Id',recId);
        delete objMap;
    }
    @AuraEnabled
    public static String getAllFields(list<String> objectTypes){
        return JSON.serialize(prism_ganttChartUtil.getFields(objectTypes));
    }
    @AuraEnabled
    public static String getQueryResults(String query){
        List<Object> lsObjs= (List<Object>) Database.query(query);
        return JSON.serialize(lsObjs);
    }
    
}