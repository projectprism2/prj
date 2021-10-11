public with sharing class prism_lookupCtrlr {
    public prism_lookupCtrlr() {

    }
    @AuraEnabled(cacheable=true)
    public static Map<String, String> findRecords(
      String searchKey,
      String objectName,
      String searchField,
      String recordType,
      String filter,
      Boolean searchWithAll,
      String maxLimit,
      String recordId,
      String fieldsToRetrieve
    ) {
      list<String> searchFields = new List<String>();
      Map<String, String> outputMap = new Map<String, String>();
      String QUERYfilter = '';
      String QUERY = '';
  
      try {
        if (
          String.isNotBlank(searchKey) &&
          String.isNotBlank(objectName) &&
          String.isNotBlank(searchField)
        ) {
          if (searchField.indexOf(',') != -1) {
            if (searchWithAll != null && searchWithAll == true) {
              searchFields = searchField.split(',');
            } else {
              searchFields.add(
                searchField.substring(0, searchField.indexOf(','))
              );
            }
          } else {
            searchFields.add(searchField);
          }
          String key = '\'%' + searchKey + '%\'';
          for (String str : searchFields) {
            QUERYfilter = String.isBlank(QUERYfilter)
              ? ('(' + str + ' LIKE ' + key + ')')
              : (QUERYfilter + 'OR' + '(' + str + ' LIKE ' + key + ')');
          }
          if (String.isNotBlank(filter)) {
            QUERYfilter = String.isBlank(QUERYfilter)
              ? ('(' + filter + ')')
              : ('(' + QUERYfilter + ')' + 'AND' + '(' + filter + ')');
          }
          if (String.isNotBlank(recordType)) {
            QUERYfilter = String.isBlank(QUERYfilter)
              ? ('( recordType.Name=\'' + recordType + '\')')
              : ('(' +
                QUERYfilter +
                ')' +
                'AND' +
                '( recordType.Name=\'' +
                recordType +
                '\')');
          }
        } else if (String.isNotBlank(recordId)) {
          QUERYfilter = 'Id=\'' + recordId + '\'';
        }
        if (String.isNotBlank(fieldsToRetrieve)) {
          QUERY = 'Select Id, ' + fieldsToRetrieve + ' From ' + objectName;
        } else {
          QUERY = 'Select Id, ' + searchField + ' From ' + objectName;
        }
  
        if (String.isNotBlank(QUERYfilter)) {
          QUERY = QUERY + ' Where ' + QUERYfilter;
        }
        if (String.isNotBlank(maxLimit)) {
          QUERY = QUERY + ' Limit ' + maxLimit;
        }
        System.debug(System.LoggingLevel.DEBUG, QUERY);
        List<SObject> sObjectList = Database.query(QUERY);
        outputMap.put('sObjectList', JSON.serialize(sObjectList));
      } catch (Exception e) {
        outputMap.put('isError', 'true');
        if (e.getMessage().containsIgnoreCase('no rows')) {
          outputMap.put('errorMessage', 'No records found.');
        } else
          outputMap.put('errorMessage', e.getMessage());
      }
  
      return outputMap;
    }
    
    /*  @AuraEnabled
      public static Map<String,String>  saveNewRecord(list<newRecordWrapper> inputFields, String objectName){
          Map<String,String> outputMap= new Map<String,String>();
          //list<newRecordWrapper> inputFields = (list<newRecordWrapper>) JSON.deserializeUntyped(fieldsStr);
          //list<newRecordWrapper> inputFields=( list<newRecordWrapper>) System.JSON.deserialize(fieldsStr, list<newRecordWrapper>.class); 
  
          try{
              SObjectType obj = Schema.getGlobalDescribe().get(objectName);
              SObject objMap = obj.newSObject();
              //Map<String,Schema.SObjectField> mfields = obj.getDescribe().fields.getMap();
              for(newRecordWrapper inputField:inputFields){
                  //Schema.DisplayType fielddataType =mfields.get(inputField.api).getDescribe().getType();
                  objMap.put(inputField.api,inputField.value);
              }
              //system.assert(false,objMap);
              //obj inputFields = (obj) JSON.deserializeUntyped(JSON.serialize(objMap));
              outputMap.put('isError','false');
              insert objMap;
              outputMap.put('recordDetails',JSON.serialize(objMap));
          }
          catch (Exception e) {
              outputMap.put('isError','true');
              outputMap.put('errorMessage','Save Failed. Please try again or contact System Admin with error '+ e.getMessage());
          }
          
          return outputMap;
      }
      
      public class newRecordWrapper{
          @AuraEnabled Public String api {get; set;}
          @AuraEnabled Public String value {get; set;}
      }*/
      

  }