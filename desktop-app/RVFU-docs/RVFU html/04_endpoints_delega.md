# 04 Endpoints Delega

delega













```
/demolitori-aci-ws/rest/cr/delega/{idDelega}
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-curl)

                          - [Java](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-java)

                          - [Android](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-android)


                          - [Obj-C](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-objc)

                          - [JavaScript](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-javascript)


                          - [C#](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-csharp)

                          - [PHP](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-php)

                          - [Perl](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-perl)

                          - [Python](#examples-DelegaCR-aggiornaDelegaUsingPUT-0-python)






```
curl -X PUT\
-H "Accept: */*"\
-H "Content-Type: application/json"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/delega/{idDelega}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaCRApi;

import java.io.File;
import java.util.*;

public class DelegaCRApiExample {

    public static void main(String[] args) {

        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        DelegaUpdate body = ; // DelegaUpdate |
        try {
            VfuRestResponseOfDelega result = apiInstance.aggiornaDelegaUsingPUT(idDelega, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#aggiornaDelegaUsingPUT");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaCRApi;

public class DelegaCRApiExample {

    public static void main(String[] args) {
        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        DelegaUpdate body = ; // DelegaUpdate |
        try {
            VfuRestResponseOfDelega result = apiInstance.aggiornaDelegaUsingPUT(idDelega, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#aggiornaDelegaUsingPUT");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idDelega = 789; // idDelega
DelegaUpdate *body = ; //  (optional)

DelegaCRApi *apiInstance = [[DelegaCRApi alloc] init];

// Permette l'aggiornamento di una delega
[apiInstance aggiornaDelegaUsingPUTWith:idDelega
    body:body
              completionHandler: ^(VfuRestResponseOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaCRApi()
var idDelega = 789; // {{Long}} idDelega
var opts = {
  'body':  // {{DelegaUpdate}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.aggiornaDelegaUsingPUT(idDelega, opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class aggiornaDelegaUsingPUTExample
    {
        public void main()
        {

            var apiInstance = new DelegaCRApi();
            var idDelega = 789;  // Long | idDelega
            var body = new DelegaUpdate(); // DelegaUpdate |  (optional)

            try
            {
                // Permette l'aggiornamento di una delega
                VfuRestResponseOfDelega result = apiInstance.aggiornaDelegaUsingPUT(idDelega, body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaCRApi.aggiornaDelegaUsingPUT: " + e.Message );
            }
        }
    }
}
```





```
aggiornaDelegaUsingPUT($idDelega, $body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaCRApi->aggiornaDelegaUsingPUT: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaCRApi;

my $api_instance = WWW::SwaggerClient::DelegaCRApi->new();
my $idDelega = 789; # Long | idDelega
my $body = WWW::SwaggerClient::Object::DelegaUpdate->new(); # DelegaUpdate |

eval {
    my $result = $api_instance->aggiornaDelegaUsingPUT(idDelega => $idDelega, body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaCRApi->aggiornaDelegaUsingPUT: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaCRApi()
idDelega = 789 # Long | idDelega
body =  # DelegaUpdate |  (optional)

try:
    # Permette l'aggiornamento di una delega
    api_response = api_instance.aggiorna_delega_using_put(idDelega, body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaCRApi->aggiornaDelegaUsingPUT: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idDelega* |







                                                      Long


                                                          (int64)



                                                          idDelega



                                                      Required



                                   |




                            Body parameters



                                Name |
                                Description |


                                body  |





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-aggiornaDelegaUsingPUT-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# consultaDelegheUsingGET1

                          Ritorna la lista paginata delle deleghe emesse













```
/demolitori-aci-ws/rest/cr/consulta/delega
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaCR-consultaDelegheUsingGET1-0-curl)

                          - [Java](#examples-DelegaCR-consultaDelegheUsingGET1-0-java)

                          - [Android](#examples-DelegaCR-consultaDelegheUsingGET1-0-android)


                          - [Obj-C](#examples-DelegaCR-consultaDelegheUsingGET1-0-objc)

                          - [JavaScript](#examples-DelegaCR-consultaDelegheUsingGET1-0-javascript)


                          - [C#](#examples-DelegaCR-consultaDelegheUsingGET1-0-csharp)

                          - [PHP](#examples-DelegaCR-consultaDelegheUsingGET1-0-php)

                          - [Perl](#examples-DelegaCR-consultaDelegheUsingGET1-0-perl)

                          - [Python](#examples-DelegaCR-consultaDelegheUsingGET1-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/consulta/delega?codiceFiscale=&dataFineA=&dataFineDa=&dataInizioA=&dataInizioDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&statoDelega=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaCRApi;

import java.io.File;
import java.util.*;

public class DelegaCRApiExample {

    public static void main(String[] args) {

        DelegaCRApi apiInstance = new DelegaCRApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET1(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#consultaDelegheUsingGET1");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaCRApi;

public class DelegaCRApiExample {

    public static void main(String[] args) {
        DelegaCRApi apiInstance = new DelegaCRApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET1(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#consultaDelegheUsingGET1");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
String *codiceFiscale = codiceFiscale_example; //  (optional)
Date *dataFineA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataFineDa = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *statoDelega = statoDelega_example; //  (optional)
Boolean *unpaged = true; //  (optional)

DelegaCRApi *apiInstance = [[DelegaCRApi alloc] init];

// Ritorna la lista paginata delle deleghe emesse
[apiInstance consultaDelegheUsingGET1With:codiceFiscale
    dataFineA:dataFineA
    dataFineDa:dataFineDa
    dataInizioA:dataInizioA
    dataInizioDa:dataInizioDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    statoDelega:statoDelega
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPageOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaCRApi()
var opts = {
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'dataFineA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataFineDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'statoDelega': statoDelega_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaDelegheUsingGET1(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class consultaDelegheUsingGET1Example
    {
        public void main()
        {

            var apiInstance = new DelegaCRApi();
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var dataFineA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataFineDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var statoDelega = statoDelega_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna la lista paginata delle deleghe emesse
                VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET1(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaCRApi.consultaDelegheUsingGET1: " + e.Message );
            }
        }
    }
}
```





```
consultaDelegheUsingGET1($codiceFiscale, $dataFineA, $dataFineDa, $dataInizioA, $dataInizioDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $statoDelega, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaCRApi->consultaDelegheUsingGET1: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaCRApi;

my $api_instance = WWW::SwaggerClient::DelegaCRApi->new();
my $codiceFiscale = codiceFiscale_example; # String |
my $dataFineA = 2013-10-20T19:20:30+01:00; # Date |
my $dataFineDa = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $statoDelega = statoDelega_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->consultaDelegheUsingGET1(codiceFiscale => $codiceFiscale, dataFineA => $dataFineA, dataFineDa => $dataFineDa, dataInizioA => $dataInizioA, dataInizioDa => $dataInizioDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, statoDelega => $statoDelega, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaCRApi->consultaDelegheUsingGET1: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaCRApi()
codiceFiscale = codiceFiscale_example # String |  (optional)
dataFineA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataFineDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
statoDelega = statoDelega_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna la lista paginata delle deleghe emesse
    api_response = api_instance.consulta_deleghe_using_get1(codiceFiscale=codiceFiscale, dataFineA=dataFineA, dataFineDa=dataFineDa, dataInizioA=dataInizioA, dataInizioDa=dataInizioDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, statoDelega=statoDelega, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaCRApi->consultaDelegheUsingGET1: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale |







                                                    String





                                 |


                                dataFineA |







                                                    Date


                                                        (date-time)





                                 |


                                dataFineDa |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioDa |







                                                    Date


                                                        (date-time)





                                 |


                                offset |







                                                    Long


                                                        (int64)





                                 |


                                pageNumber |







                                                    Integer


                                                        (int32)





                                 |


                                pageSize |







                                                    Integer


                                                        (int32)





                                 |


                                paged |







                                                    Boolean





                                 |


                                sort.sorted |







                                                    Boolean





                                 |


                                sort.unsorted |







                                                    Boolean





                                 |


                                statoDelega |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaDelegheUsingGET1-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# eliminaDelegaUsingDELETE

                          Permette l'annullamento di una delega













```
/demolitori-aci-ws/rest/cr/delega/{idDelega}
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-curl)

                          - [Java](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-java)

                          - [Android](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-android)


                          - [Obj-C](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-objc)

                          - [JavaScript](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-javascript)


                          - [C#](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-csharp)

                          - [PHP](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-php)

                          - [Perl](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-perl)

                          - [Python](#examples-DelegaCR-eliminaDelegaUsingDELETE-0-python)






```
curl -X DELETE\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/delega/{idDelega}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaCRApi;

import java.io.File;
import java.util.*;

public class DelegaCRApiExample {

    public static void main(String[] args) {

        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.eliminaDelegaUsingDELETE(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#eliminaDelegaUsingDELETE");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaCRApi;

public class DelegaCRApiExample {

    public static void main(String[] args) {
        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.eliminaDelegaUsingDELETE(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#eliminaDelegaUsingDELETE");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idDelega = 789; // idDelega

DelegaCRApi *apiInstance = [[DelegaCRApi alloc] init];

// Permette l'annullamento di una delega
[apiInstance eliminaDelegaUsingDELETEWith:idDelega
              completionHandler: ^(VfuRestResponseOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaCRApi()
var idDelega = 789; // {{Long}} idDelega

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.eliminaDelegaUsingDELETE(idDelega, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class eliminaDelegaUsingDELETEExample
    {
        public void main()
        {

            var apiInstance = new DelegaCRApi();
            var idDelega = 789;  // Long | idDelega

            try
            {
                // Permette l'annullamento di una delega
                VfuRestResponseOfDelega result = apiInstance.eliminaDelegaUsingDELETE(idDelega);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaCRApi.eliminaDelegaUsingDELETE: " + e.Message );
            }
        }
    }
}
```





```
eliminaDelegaUsingDELETE($idDelega);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaCRApi->eliminaDelegaUsingDELETE: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaCRApi;

my $api_instance = WWW::SwaggerClient::DelegaCRApi->new();
my $idDelega = 789; # Long | idDelega

eval {
    my $result = $api_instance->eliminaDelegaUsingDELETE(idDelega => $idDelega);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaCRApi->eliminaDelegaUsingDELETE: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaCRApi()
idDelega = 789 # Long | idDelega

try:
    # Permette l'annullamento di una delega
    api_response = api_instance.elimina_delega_using_delete(idDelega)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaCRApi->eliminaDelegaUsingDELETE: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idDelega* |







                                                      Long


                                                          (int64)



                                                          idDelega



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-eliminaDelegaUsingDELETE-200-schema)














###  Status: 204 - No Content









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden















# findOneUsingGET5

                          Ritorna il dettaglio di una delega













```
/demolitori-aci-ws/rest/cr/delega/{idDelega}
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaCR-findOneUsingGET5-0-curl)

                          - [Java](#examples-DelegaCR-findOneUsingGET5-0-java)

                          - [Android](#examples-DelegaCR-findOneUsingGET5-0-android)


                          - [Obj-C](#examples-DelegaCR-findOneUsingGET5-0-objc)

                          - [JavaScript](#examples-DelegaCR-findOneUsingGET5-0-javascript)


                          - [C#](#examples-DelegaCR-findOneUsingGET5-0-csharp)

                          - [PHP](#examples-DelegaCR-findOneUsingGET5-0-php)

                          - [Perl](#examples-DelegaCR-findOneUsingGET5-0-perl)

                          - [Python](#examples-DelegaCR-findOneUsingGET5-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/delega/{idDelega}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaCRApi;

import java.io.File;
import java.util.*;

public class DelegaCRApiExample {

    public static void main(String[] args) {

        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.findOneUsingGET5(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#findOneUsingGET5");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaCRApi;

public class DelegaCRApiExample {

    public static void main(String[] args) {
        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.findOneUsingGET5(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#findOneUsingGET5");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idDelega = 789; // idDelega

DelegaCRApi *apiInstance = [[DelegaCRApi alloc] init];

// Ritorna il dettaglio di una delega
[apiInstance findOneUsingGET5With:idDelega
              completionHandler: ^(VfuRestResponseOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaCRApi()
var idDelega = 789; // {{Long}} idDelega

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.findOneUsingGET5(idDelega, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class findOneUsingGET5Example
    {
        public void main()
        {

            var apiInstance = new DelegaCRApi();
            var idDelega = 789;  // Long | idDelega

            try
            {
                // Ritorna il dettaglio di una delega
                VfuRestResponseOfDelega result = apiInstance.findOneUsingGET5(idDelega);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaCRApi.findOneUsingGET5: " + e.Message );
            }
        }
    }
}
```





```
findOneUsingGET5($idDelega);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaCRApi->findOneUsingGET5: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaCRApi;

my $api_instance = WWW::SwaggerClient::DelegaCRApi->new();
my $idDelega = 789; # Long | idDelega

eval {
    my $result = $api_instance->findOneUsingGET5(idDelega => $idDelega);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaCRApi->findOneUsingGET5: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaCRApi()
idDelega = 789 # Long | idDelega

try:
    # Ritorna il dettaglio di una delega
    api_response = api_instance.find_one_using_get5(idDelega)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaCRApi->findOneUsingGET5: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idDelega* |







                                                      Long


                                                          (int64)



                                                          idDelega



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-findOneUsingGET5-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# inserisciDelegaUsingPOST

                          Permette l'inserimento di una nuova delega













```
/demolitori-aci-ws/rest/cr/delega
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaCR-inserisciDelegaUsingPOST-0-curl)

                          - [Java](#examples-DelegaCR-inserisciDelegaUsingPOST-0-java)

                          - [Android](#examples-DelegaCR-inserisciDelegaUsingPOST-0-android)


                          - [Obj-C](#examples-DelegaCR-inserisciDelegaUsingPOST-0-objc)

                          - [JavaScript](#examples-DelegaCR-inserisciDelegaUsingPOST-0-javascript)


                          - [C#](#examples-DelegaCR-inserisciDelegaUsingPOST-0-csharp)

                          - [PHP](#examples-DelegaCR-inserisciDelegaUsingPOST-0-php)

                          - [Perl](#examples-DelegaCR-inserisciDelegaUsingPOST-0-perl)

                          - [Python](#examples-DelegaCR-inserisciDelegaUsingPOST-0-python)






```
curl -X POST\
-H "Accept: */*"\
-H "Content-Type: application/json"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/delega"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaCRApi;

import java.io.File;
import java.util.*;

public class DelegaCRApiExample {

    public static void main(String[] args) {

        DelegaCRApi apiInstance = new DelegaCRApi();
        DelegaCreate body = ; // DelegaCreate |
        try {
            VfuRestResponseOfDelega result = apiInstance.inserisciDelegaUsingPOST(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#inserisciDelegaUsingPOST");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaCRApi;

public class DelegaCRApiExample {

    public static void main(String[] args) {
        DelegaCRApi apiInstance = new DelegaCRApi();
        DelegaCreate body = ; // DelegaCreate |
        try {
            VfuRestResponseOfDelega result = apiInstance.inserisciDelegaUsingPOST(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#inserisciDelegaUsingPOST");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
DelegaCreate *body = ; //  (optional)

DelegaCRApi *apiInstance = [[DelegaCRApi alloc] init];

// Permette l'inserimento di una nuova delega
[apiInstance inserisciDelegaUsingPOSTWith:body
              completionHandler: ^(VfuRestResponseOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaCRApi()
var opts = {
  'body':  // {{DelegaCreate}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.inserisciDelegaUsingPOST(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class inserisciDelegaUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new DelegaCRApi();
            var body = new DelegaCreate(); // DelegaCreate |  (optional)

            try
            {
                // Permette l'inserimento di una nuova delega
                VfuRestResponseOfDelega result = apiInstance.inserisciDelegaUsingPOST(body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaCRApi.inserisciDelegaUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
inserisciDelegaUsingPOST($body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaCRApi->inserisciDelegaUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaCRApi;

my $api_instance = WWW::SwaggerClient::DelegaCRApi->new();
my $body = WWW::SwaggerClient::Object::DelegaCreate->new(); # DelegaCreate |

eval {
    my $result = $api_instance->inserisciDelegaUsingPOST(body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaCRApi->inserisciDelegaUsingPOST: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaCRApi()
body =  # DelegaCreate |  (optional)

try:
    # Permette l'inserimento di una nuova delega
    api_response = api_instance.inserisci_delega_using_post(body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaCRApi->inserisciDelegaUsingPOST: %s\n" % e)
```





## Parameters

                            Body parameters



                                Name |
                                Description |


                                body  |





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-inserisciDelegaUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# revocaDelegaUsingPUT

                          Permette la revoca di una delega













```
/demolitori-aci-ws/rest/cr/revoca/delega/{idDelega}
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaCR-revocaDelegaUsingPUT-0-curl)

                          - [Java](#examples-DelegaCR-revocaDelegaUsingPUT-0-java)

                          - [Android](#examples-DelegaCR-revocaDelegaUsingPUT-0-android)


                          - [Obj-C](#examples-DelegaCR-revocaDelegaUsingPUT-0-objc)

                          - [JavaScript](#examples-DelegaCR-revocaDelegaUsingPUT-0-javascript)


                          - [C#](#examples-DelegaCR-revocaDelegaUsingPUT-0-csharp)

                          - [PHP](#examples-DelegaCR-revocaDelegaUsingPUT-0-php)

                          - [Perl](#examples-DelegaCR-revocaDelegaUsingPUT-0-perl)

                          - [Python](#examples-DelegaCR-revocaDelegaUsingPUT-0-python)






```
curl -X PUT\
-H "Accept: */*"\
-H "Content-Type: application/json"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/revoca/delega/{idDelega}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaCRApi;

import java.io.File;
import java.util.*;

public class DelegaCRApiExample {

    public static void main(String[] args) {

        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        DelegaRevoca body = ; // DelegaRevoca |
        try {
            VfuRestResponseOfDelega result = apiInstance.revocaDelegaUsingPUT(idDelega, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#revocaDelegaUsingPUT");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaCRApi;

public class DelegaCRApiExample {

    public static void main(String[] args) {
        DelegaCRApi apiInstance = new DelegaCRApi();
        Long idDelega = 789; // Long | idDelega
        DelegaRevoca body = ; // DelegaRevoca |
        try {
            VfuRestResponseOfDelega result = apiInstance.revocaDelegaUsingPUT(idDelega, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#revocaDelegaUsingPUT");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idDelega = 789; // idDelega
DelegaRevoca *body = ; //  (optional)

DelegaCRApi *apiInstance = [[DelegaCRApi alloc] init];

// Permette la revoca di una delega
[apiInstance revocaDelegaUsingPUTWith:idDelega
    body:body
              completionHandler: ^(VfuRestResponseOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaCRApi()
var idDelega = 789; // {{Long}} idDelega
var opts = {
  'body':  // {{DelegaRevoca}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.revocaDelegaUsingPUT(idDelega, opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class revocaDelegaUsingPUTExample
    {
        public void main()
        {

            var apiInstance = new DelegaCRApi();
            var idDelega = 789;  // Long | idDelega
            var body = new DelegaRevoca(); // DelegaRevoca |  (optional)

            try
            {
                // Permette la revoca di una delega
                VfuRestResponseOfDelega result = apiInstance.revocaDelegaUsingPUT(idDelega, body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaCRApi.revocaDelegaUsingPUT: " + e.Message );
            }
        }
    }
}
```





```
revocaDelegaUsingPUT($idDelega, $body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaCRApi->revocaDelegaUsingPUT: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaCRApi;

my $api_instance = WWW::SwaggerClient::DelegaCRApi->new();
my $idDelega = 789; # Long | idDelega
my $body = WWW::SwaggerClient::Object::DelegaRevoca->new(); # DelegaRevoca |

eval {
    my $result = $api_instance->revocaDelegaUsingPUT(idDelega => $idDelega, body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaCRApi->revocaDelegaUsingPUT: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaCRApi()
idDelega = 789 # Long | idDelega
body =  # DelegaRevoca |  (optional)

try:
    # Permette la revoca di una delega
    api_response = api_instance.revoca_delega_using_put(idDelega, body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaCRApi->revocaDelegaUsingPUT: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idDelega* |







                                                      Long


                                                          (int64)



                                                          idDelega



                                                      Required



                                   |




                            Body parameters



                                Name |
                                Description |


                                body  |





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-revocaDelegaUsingPUT-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# stampaDelegheUsingGET1

                          Ritorna il pdf della lista paginata delle deleghe emesse













```
/demolitori-aci-ws/rest/cr/stampa/delega
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaCR-stampaDelegheUsingGET1-0-curl)

                          - [Java](#examples-DelegaCR-stampaDelegheUsingGET1-0-java)

                          - [Android](#examples-DelegaCR-stampaDelegheUsingGET1-0-android)


                          - [Obj-C](#examples-DelegaCR-stampaDelegheUsingGET1-0-objc)

                          - [JavaScript](#examples-DelegaCR-stampaDelegheUsingGET1-0-javascript)


                          - [C#](#examples-DelegaCR-stampaDelegheUsingGET1-0-csharp)

                          - [PHP](#examples-DelegaCR-stampaDelegheUsingGET1-0-php)

                          - [Perl](#examples-DelegaCR-stampaDelegheUsingGET1-0-perl)

                          - [Python](#examples-DelegaCR-stampaDelegheUsingGET1-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/stampa/delega?codiceFiscale=&dataFineA=&dataFineDa=&dataInizioA=&dataInizioDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&statoDelega=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaCRApi;

import java.io.File;
import java.util.*;

public class DelegaCRApiExample {

    public static void main(String[] args) {

        DelegaCRApi apiInstance = new DelegaCRApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET1(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#stampaDelegheUsingGET1");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaCRApi;

public class DelegaCRApiExample {

    public static void main(String[] args) {
        DelegaCRApi apiInstance = new DelegaCRApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET1(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaCRApi#stampaDelegheUsingGET1");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
String *codiceFiscale = codiceFiscale_example; //  (optional)
Date *dataFineA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataFineDa = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *statoDelega = statoDelega_example; //  (optional)
Boolean *unpaged = true; //  (optional)

DelegaCRApi *apiInstance = [[DelegaCRApi alloc] init];

// Ritorna il pdf della lista paginata delle deleghe emesse
[apiInstance stampaDelegheUsingGET1With:codiceFiscale
    dataFineA:dataFineA
    dataFineDa:dataFineDa
    dataInizioA:dataInizioA
    dataInizioDa:dataInizioDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    statoDelega:statoDelega
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPdfBean output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaCRApi()
var opts = {
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'dataFineA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataFineDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'statoDelega': statoDelega_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.stampaDelegheUsingGET1(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class stampaDelegheUsingGET1Example
    {
        public void main()
        {

            var apiInstance = new DelegaCRApi();
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var dataFineA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataFineDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var statoDelega = statoDelega_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna il pdf della lista paginata delle deleghe emesse
                VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET1(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaCRApi.stampaDelegheUsingGET1: " + e.Message );
            }
        }
    }
}
```





```
stampaDelegheUsingGET1($codiceFiscale, $dataFineA, $dataFineDa, $dataInizioA, $dataInizioDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $statoDelega, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaCRApi->stampaDelegheUsingGET1: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaCRApi;

my $api_instance = WWW::SwaggerClient::DelegaCRApi->new();
my $codiceFiscale = codiceFiscale_example; # String |
my $dataFineA = 2013-10-20T19:20:30+01:00; # Date |
my $dataFineDa = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $statoDelega = statoDelega_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->stampaDelegheUsingGET1(codiceFiscale => $codiceFiscale, dataFineA => $dataFineA, dataFineDa => $dataFineDa, dataInizioA => $dataInizioA, dataInizioDa => $dataInizioDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, statoDelega => $statoDelega, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaCRApi->stampaDelegheUsingGET1: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaCRApi()
codiceFiscale = codiceFiscale_example # String |  (optional)
dataFineA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataFineDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
statoDelega = statoDelega_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna il pdf della lista paginata delle deleghe emesse
    api_response = api_instance.stampa_deleghe_using_get1(codiceFiscale=codiceFiscale, dataFineA=dataFineA, dataFineDa=dataFineDa, dataInizioA=dataInizioA, dataInizioDa=dataInizioDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, statoDelega=statoDelega, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaCRApi->stampaDelegheUsingGET1: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale |







                                                    String





                                 |


                                dataFineA |







                                                    Date


                                                        (date-time)





                                 |


                                dataFineDa |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioDa |







                                                    Date


                                                        (date-time)





                                 |


                                offset |







                                                    Long


                                                        (int64)





                                 |


                                pageNumber |







                                                    Integer


                                                        (int32)





                                 |


                                pageSize |







                                                    Integer


                                                        (int32)





                                 |


                                paged |







                                                    Boolean





                                 |


                                sort.sorted |







                                                    Boolean





                                 |


                                sort.unsorted |







                                                    Boolean





                                 |


                                statoDelega |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-stampaDelegheUsingGET1-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# DelegaConcessionario





# consultaDelegheUsingGET

                          Ritorna la lista paginata delle deleghe in cui il concessionario è coinvolto













```
/demolitori-aci-ws/rest/concessionario/consulta/delega
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-curl)

                          - [Java](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-java)

                          - [Android](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-android)


                          - [Obj-C](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-objc)

                          - [JavaScript](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-javascript)


                          - [C#](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-csharp)

                          - [PHP](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-php)

                          - [Perl](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-perl)

                          - [Python](#examples-DelegaConcessionario-consultaDelegheUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/concessionario/consulta/delega?codiceFiscale=&dataFineA=&dataFineDa=&dataInizioA=&dataInizioDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&statoDelega=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaConcessionarioApi;

import java.io.File;
import java.util.*;

public class DelegaConcessionarioApiExample {

    public static void main(String[] args) {

        DelegaConcessionarioApi apiInstance = new DelegaConcessionarioApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaConcessionarioApi#consultaDelegheUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaConcessionarioApi;

public class DelegaConcessionarioApiExample {

    public static void main(String[] args) {
        DelegaConcessionarioApi apiInstance = new DelegaConcessionarioApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaConcessionarioApi#consultaDelegheUsingGET");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
String *codiceFiscale = codiceFiscale_example; //  (optional)
Date *dataFineA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataFineDa = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *statoDelega = statoDelega_example; //  (optional)
Boolean *unpaged = true; //  (optional)

DelegaConcessionarioApi *apiInstance = [[DelegaConcessionarioApi alloc] init];

// Ritorna la lista paginata delle deleghe in cui il concessionario è coinvolto
[apiInstance consultaDelegheUsingGETWith:codiceFiscale
    dataFineA:dataFineA
    dataFineDa:dataFineDa
    dataInizioA:dataInizioA
    dataInizioDa:dataInizioDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    statoDelega:statoDelega
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPageOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaConcessionarioApi()
var opts = {
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'dataFineA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataFineDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'statoDelega': statoDelega_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaDelegheUsingGET(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class consultaDelegheUsingGETExample
    {
        public void main()
        {

            var apiInstance = new DelegaConcessionarioApi();
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var dataFineA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataFineDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var statoDelega = statoDelega_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna la lista paginata delle deleghe in cui il concessionario è coinvolto
                VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaConcessionarioApi.consultaDelegheUsingGET: " + e.Message );
            }
        }
    }
}
```





```
consultaDelegheUsingGET($codiceFiscale, $dataFineA, $dataFineDa, $dataInizioA, $dataInizioDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $statoDelega, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaConcessionarioApi->consultaDelegheUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaConcessionarioApi;

my $api_instance = WWW::SwaggerClient::DelegaConcessionarioApi->new();
my $codiceFiscale = codiceFiscale_example; # String |
my $dataFineA = 2013-10-20T19:20:30+01:00; # Date |
my $dataFineDa = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $statoDelega = statoDelega_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->consultaDelegheUsingGET(codiceFiscale => $codiceFiscale, dataFineA => $dataFineA, dataFineDa => $dataFineDa, dataInizioA => $dataInizioA, dataInizioDa => $dataInizioDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, statoDelega => $statoDelega, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaConcessionarioApi->consultaDelegheUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaConcessionarioApi()
codiceFiscale = codiceFiscale_example # String |  (optional)
dataFineA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataFineDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
statoDelega = statoDelega_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna la lista paginata delle deleghe in cui il concessionario è coinvolto
    api_response = api_instance.consulta_deleghe_using_get(codiceFiscale=codiceFiscale, dataFineA=dataFineA, dataFineDa=dataFineDa, dataInizioA=dataInizioA, dataInizioDa=dataInizioDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, statoDelega=statoDelega, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaConcessionarioApi->consultaDelegheUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale |







                                                    String





                                 |


                                dataFineA |







                                                    Date


                                                        (date-time)





                                 |


                                dataFineDa |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioDa |







                                                    Date


                                                        (date-time)





                                 |


                                offset |







                                                    Long


                                                        (int64)





                                 |


                                pageNumber |







                                                    Integer


                                                        (int32)





                                 |


                                pageSize |







                                                    Integer


                                                        (int32)





                                 |


                                paged |







                                                    Boolean





                                 |


                                sort.sorted |







                                                    Boolean





                                 |


                                sort.unsorted |







                                                    Boolean





                                 |


                                statoDelega |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaDelegheUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# findOneUsingGET1

                          Ritorna il dettaglio della delega













```
/demolitori-aci-ws/rest/concessionario/delega/{idDelega}
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaConcessionario-findOneUsingGET1-0-curl)

                          - [Java](#examples-DelegaConcessionario-findOneUsingGET1-0-java)

                          - [Android](#examples-DelegaConcessionario-findOneUsingGET1-0-android)


                          - [Obj-C](#examples-DelegaConcessionario-findOneUsingGET1-0-objc)

                          - [JavaScript](#examples-DelegaConcessionario-findOneUsingGET1-0-javascript)


                          - [C#](#examples-DelegaConcessionario-findOneUsingGET1-0-csharp)

                          - [PHP](#examples-DelegaConcessionario-findOneUsingGET1-0-php)

                          - [Perl](#examples-DelegaConcessionario-findOneUsingGET1-0-perl)

                          - [Python](#examples-DelegaConcessionario-findOneUsingGET1-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/concessionario/delega/{idDelega}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaConcessionarioApi;

import java.io.File;
import java.util.*;

public class DelegaConcessionarioApiExample {

    public static void main(String[] args) {

        DelegaConcessionarioApi apiInstance = new DelegaConcessionarioApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.findOneUsingGET1(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaConcessionarioApi#findOneUsingGET1");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaConcessionarioApi;

public class DelegaConcessionarioApiExample {

    public static void main(String[] args) {
        DelegaConcessionarioApi apiInstance = new DelegaConcessionarioApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.findOneUsingGET1(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaConcessionarioApi#findOneUsingGET1");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idDelega = 789; // idDelega

DelegaConcessionarioApi *apiInstance = [[DelegaConcessionarioApi alloc] init];

// Ritorna il dettaglio della delega
[apiInstance findOneUsingGET1With:idDelega
              completionHandler: ^(VfuRestResponseOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaConcessionarioApi()
var idDelega = 789; // {{Long}} idDelega

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.findOneUsingGET1(idDelega, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class findOneUsingGET1Example
    {
        public void main()
        {

            var apiInstance = new DelegaConcessionarioApi();
            var idDelega = 789;  // Long | idDelega

            try
            {
                // Ritorna il dettaglio della delega
                VfuRestResponseOfDelega result = apiInstance.findOneUsingGET1(idDelega);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaConcessionarioApi.findOneUsingGET1: " + e.Message );
            }
        }
    }
}
```





```
findOneUsingGET1($idDelega);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaConcessionarioApi->findOneUsingGET1: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaConcessionarioApi;

my $api_instance = WWW::SwaggerClient::DelegaConcessionarioApi->new();
my $idDelega = 789; # Long | idDelega

eval {
    my $result = $api_instance->findOneUsingGET1(idDelega => $idDelega);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaConcessionarioApi->findOneUsingGET1: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaConcessionarioApi()
idDelega = 789 # Long | idDelega

try:
    # Ritorna il dettaglio della delega
    api_response = api_instance.find_one_using_get1(idDelega)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaConcessionarioApi->findOneUsingGET1: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idDelega* |







                                                      Long


                                                          (int64)



                                                          idDelega



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-findOneUsingGET1-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# stampaDelegheUsingGET

                          Ritorna il pdf della lista paginata delle delghe in cui il concessionario è coinvolto













```
/demolitori-aci-ws/rest/concessionario/stampa/delega
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-curl)

                          - [Java](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-java)

                          - [Android](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-android)


                          - [Obj-C](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-objc)

                          - [JavaScript](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-javascript)


                          - [C#](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-csharp)

                          - [PHP](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-php)

                          - [Perl](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-perl)

                          - [Python](#examples-DelegaConcessionario-stampaDelegheUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/concessionario/stampa/delega?codiceFiscale=&dataFineA=&dataFineDa=&dataInizioA=&dataInizioDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&statoDelega=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaConcessionarioApi;

import java.io.File;
import java.util.*;

public class DelegaConcessionarioApiExample {

    public static void main(String[] args) {

        DelegaConcessionarioApi apiInstance = new DelegaConcessionarioApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaConcessionarioApi#stampaDelegheUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaConcessionarioApi;

public class DelegaConcessionarioApiExample {

    public static void main(String[] args) {
        DelegaConcessionarioApi apiInstance = new DelegaConcessionarioApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaConcessionarioApi#stampaDelegheUsingGET");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
String *codiceFiscale = codiceFiscale_example; //  (optional)
Date *dataFineA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataFineDa = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *statoDelega = statoDelega_example; //  (optional)
Boolean *unpaged = true; //  (optional)

DelegaConcessionarioApi *apiInstance = [[DelegaConcessionarioApi alloc] init];

// Ritorna il pdf della lista paginata delle delghe in cui il concessionario è coinvolto
[apiInstance stampaDelegheUsingGETWith:codiceFiscale
    dataFineA:dataFineA
    dataFineDa:dataFineDa
    dataInizioA:dataInizioA
    dataInizioDa:dataInizioDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    statoDelega:statoDelega
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPdfBean output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaConcessionarioApi()
var opts = {
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'dataFineA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataFineDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'statoDelega': statoDelega_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.stampaDelegheUsingGET(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class stampaDelegheUsingGETExample
    {
        public void main()
        {

            var apiInstance = new DelegaConcessionarioApi();
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var dataFineA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataFineDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var statoDelega = statoDelega_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna il pdf della lista paginata delle delghe in cui il concessionario è coinvolto
                VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaConcessionarioApi.stampaDelegheUsingGET: " + e.Message );
            }
        }
    }
}
```





```
stampaDelegheUsingGET($codiceFiscale, $dataFineA, $dataFineDa, $dataInizioA, $dataInizioDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $statoDelega, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaConcessionarioApi->stampaDelegheUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaConcessionarioApi;

my $api_instance = WWW::SwaggerClient::DelegaConcessionarioApi->new();
my $codiceFiscale = codiceFiscale_example; # String |
my $dataFineA = 2013-10-20T19:20:30+01:00; # Date |
my $dataFineDa = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $statoDelega = statoDelega_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->stampaDelegheUsingGET(codiceFiscale => $codiceFiscale, dataFineA => $dataFineA, dataFineDa => $dataFineDa, dataInizioA => $dataInizioA, dataInizioDa => $dataInizioDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, statoDelega => $statoDelega, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaConcessionarioApi->stampaDelegheUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaConcessionarioApi()
codiceFiscale = codiceFiscale_example # String |  (optional)
dataFineA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataFineDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
statoDelega = statoDelega_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna il pdf della lista paginata delle delghe in cui il concessionario è coinvolto
    api_response = api_instance.stampa_deleghe_using_get(codiceFiscale=codiceFiscale, dataFineA=dataFineA, dataFineDa=dataFineDa, dataInizioA=dataInizioA, dataInizioDa=dataInizioDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, statoDelega=statoDelega, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaConcessionarioApi->stampaDelegheUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale |







                                                    String





                                 |


                                dataFineA |







                                                    Date


                                                        (date-time)





                                 |


                                dataFineDa |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioDa |







                                                    Date


                                                        (date-time)





                                 |


                                offset |







                                                    Long


                                                        (int64)





                                 |


                                pageNumber |







                                                    Integer


                                                        (int32)





                                 |


                                pageSize |







                                                    Integer


                                                        (int32)





                                 |


                                paged |







                                                    Boolean





                                 |


                                sort.sorted |







                                                    Boolean





                                 |


                                sort.unsorted |







                                                    Boolean





                                 |


                                statoDelega |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-stampaDelegheUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# DelegaUMC





# consultaDelegheUsingGET2

                          Ritorna la lista paginata delle deleghe













```
/demolitori-aci-ws/rest/umc/consulta/delega
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaUMC-consultaDelegheUsingGET2-0-curl)

                          - [Java](#examples-DelegaUMC-consultaDelegheUsingGET2-0-java)

                          - [Android](#examples-DelegaUMC-consultaDelegheUsingGET2-0-android)


                          - [Obj-C](#examples-DelegaUMC-consultaDelegheUsingGET2-0-objc)

                          - [JavaScript](#examples-DelegaUMC-consultaDelegheUsingGET2-0-javascript)


                          - [C#](#examples-DelegaUMC-consultaDelegheUsingGET2-0-csharp)

                          - [PHP](#examples-DelegaUMC-consultaDelegheUsingGET2-0-php)

                          - [Perl](#examples-DelegaUMC-consultaDelegheUsingGET2-0-perl)

                          - [Python](#examples-DelegaUMC-consultaDelegheUsingGET2-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/consulta/delega?codiceFiscale=&dataFineA=&dataFineDa=&dataInizioA=&dataInizioDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&statoDelega=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaUMCApi;

import java.io.File;
import java.util.*;

public class DelegaUMCApiExample {

    public static void main(String[] args) {

        DelegaUMCApi apiInstance = new DelegaUMCApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET2(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaUMCApi#consultaDelegheUsingGET2");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaUMCApi;

public class DelegaUMCApiExample {

    public static void main(String[] args) {
        DelegaUMCApi apiInstance = new DelegaUMCApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET2(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaUMCApi#consultaDelegheUsingGET2");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
String *codiceFiscale = codiceFiscale_example; //  (optional)
Date *dataFineA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataFineDa = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *statoDelega = statoDelega_example; //  (optional)
Boolean *unpaged = true; //  (optional)

DelegaUMCApi *apiInstance = [[DelegaUMCApi alloc] init];

// Ritorna la lista paginata delle deleghe
[apiInstance consultaDelegheUsingGET2With:codiceFiscale
    dataFineA:dataFineA
    dataFineDa:dataFineDa
    dataInizioA:dataInizioA
    dataInizioDa:dataInizioDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    statoDelega:statoDelega
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPageOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaUMCApi()
var opts = {
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'dataFineA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataFineDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'statoDelega': statoDelega_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaDelegheUsingGET2(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class consultaDelegheUsingGET2Example
    {
        public void main()
        {

            var apiInstance = new DelegaUMCApi();
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var dataFineA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataFineDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var statoDelega = statoDelega_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna la lista paginata delle deleghe
                VfuRestResponseOfPageOfDelega result = apiInstance.consultaDelegheUsingGET2(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaUMCApi.consultaDelegheUsingGET2: " + e.Message );
            }
        }
    }
}
```





```
consultaDelegheUsingGET2($codiceFiscale, $dataFineA, $dataFineDa, $dataInizioA, $dataInizioDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $statoDelega, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaUMCApi->consultaDelegheUsingGET2: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaUMCApi;

my $api_instance = WWW::SwaggerClient::DelegaUMCApi->new();
my $codiceFiscale = codiceFiscale_example; # String |
my $dataFineA = 2013-10-20T19:20:30+01:00; # Date |
my $dataFineDa = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $statoDelega = statoDelega_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->consultaDelegheUsingGET2(codiceFiscale => $codiceFiscale, dataFineA => $dataFineA, dataFineDa => $dataFineDa, dataInizioA => $dataInizioA, dataInizioDa => $dataInizioDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, statoDelega => $statoDelega, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaUMCApi->consultaDelegheUsingGET2: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaUMCApi()
codiceFiscale = codiceFiscale_example # String |  (optional)
dataFineA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataFineDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
statoDelega = statoDelega_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna la lista paginata delle deleghe
    api_response = api_instance.consulta_deleghe_using_get2(codiceFiscale=codiceFiscale, dataFineA=dataFineA, dataFineDa=dataFineDa, dataInizioA=dataInizioA, dataInizioDa=dataInizioDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, statoDelega=statoDelega, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaUMCApi->consultaDelegheUsingGET2: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale |







                                                    String





                                 |


                                dataFineA |







                                                    Date


                                                        (date-time)





                                 |


                                dataFineDa |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioDa |







                                                    Date


                                                        (date-time)





                                 |


                                offset |







                                                    Long


                                                        (int64)





                                 |


                                pageNumber |







                                                    Integer


                                                        (int32)





                                 |


                                pageSize |







                                                    Integer


                                                        (int32)





                                 |


                                paged |







                                                    Boolean





                                 |


                                sort.sorted |







                                                    Boolean





                                 |


                                sort.unsorted |







                                                    Boolean





                                 |


                                statoDelega |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaDelegheUsingGET2-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# findOneUsingGET8

                          Ritorna il dettaglio di una delega













```
/demolitori-aci-ws/rest/umc/delega/{idDelega}
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaUMC-findOneUsingGET8-0-curl)

                          - [Java](#examples-DelegaUMC-findOneUsingGET8-0-java)

                          - [Android](#examples-DelegaUMC-findOneUsingGET8-0-android)


                          - [Obj-C](#examples-DelegaUMC-findOneUsingGET8-0-objc)

                          - [JavaScript](#examples-DelegaUMC-findOneUsingGET8-0-javascript)


                          - [C#](#examples-DelegaUMC-findOneUsingGET8-0-csharp)

                          - [PHP](#examples-DelegaUMC-findOneUsingGET8-0-php)

                          - [Perl](#examples-DelegaUMC-findOneUsingGET8-0-perl)

                          - [Python](#examples-DelegaUMC-findOneUsingGET8-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/delega/{idDelega}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaUMCApi;

import java.io.File;
import java.util.*;

public class DelegaUMCApiExample {

    public static void main(String[] args) {

        DelegaUMCApi apiInstance = new DelegaUMCApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.findOneUsingGET8(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaUMCApi#findOneUsingGET8");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaUMCApi;

public class DelegaUMCApiExample {

    public static void main(String[] args) {
        DelegaUMCApi apiInstance = new DelegaUMCApi();
        Long idDelega = 789; // Long | idDelega
        try {
            VfuRestResponseOfDelega result = apiInstance.findOneUsingGET8(idDelega);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaUMCApi#findOneUsingGET8");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idDelega = 789; // idDelega

DelegaUMCApi *apiInstance = [[DelegaUMCApi alloc] init];

// Ritorna il dettaglio di una delega
[apiInstance findOneUsingGET8With:idDelega
              completionHandler: ^(VfuRestResponseOfDelega output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaUMCApi()
var idDelega = 789; // {{Long}} idDelega

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.findOneUsingGET8(idDelega, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class findOneUsingGET8Example
    {
        public void main()
        {

            var apiInstance = new DelegaUMCApi();
            var idDelega = 789;  // Long | idDelega

            try
            {
                // Ritorna il dettaglio di una delega
                VfuRestResponseOfDelega result = apiInstance.findOneUsingGET8(idDelega);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaUMCApi.findOneUsingGET8: " + e.Message );
            }
        }
    }
}
```





```
findOneUsingGET8($idDelega);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaUMCApi->findOneUsingGET8: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaUMCApi;

my $api_instance = WWW::SwaggerClient::DelegaUMCApi->new();
my $idDelega = 789; # Long | idDelega

eval {
    my $result = $api_instance->findOneUsingGET8(idDelega => $idDelega);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaUMCApi->findOneUsingGET8: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaUMCApi()
idDelega = 789 # Long | idDelega

try:
    # Ritorna il dettaglio di una delega
    api_response = api_instance.find_one_using_get8(idDelega)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaUMCApi->findOneUsingGET8: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idDelega* |







                                                      Long


                                                          (int64)



                                                          idDelega



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-findOneUsingGET8-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# stampaDelegheUsingGET2

                          Ritorna il pdf della lista paginata delle deleghe













```
/demolitori-aci-ws/rest/umc/stampa/delega
```



### Usage and SDK Samples





                          - [Curl](#examples-DelegaUMC-stampaDelegheUsingGET2-0-curl)

                          - [Java](#examples-DelegaUMC-stampaDelegheUsingGET2-0-java)

                          - [Android](#examples-DelegaUMC-stampaDelegheUsingGET2-0-android)


                          - [Obj-C](#examples-DelegaUMC-stampaDelegheUsingGET2-0-objc)

                          - [JavaScript](#examples-DelegaUMC-stampaDelegheUsingGET2-0-javascript)


                          - [C#](#examples-DelegaUMC-stampaDelegheUsingGET2-0-csharp)

                          - [PHP](#examples-DelegaUMC-stampaDelegheUsingGET2-0-php)

                          - [Perl](#examples-DelegaUMC-stampaDelegheUsingGET2-0-perl)

                          - [Python](#examples-DelegaUMC-stampaDelegheUsingGET2-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/stampa/delega?codiceFiscale=&dataFineA=&dataFineDa=&dataInizioA=&dataInizioDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&statoDelega=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.DelegaUMCApi;

import java.io.File;
import java.util.*;

public class DelegaUMCApiExample {

    public static void main(String[] args) {

        DelegaUMCApi apiInstance = new DelegaUMCApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET2(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaUMCApi#stampaDelegheUsingGET2");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.DelegaUMCApi;

public class DelegaUMCApiExample {

    public static void main(String[] args) {
        DelegaUMCApi apiInstance = new DelegaUMCApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Date dataFineA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataFineDa = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInizioDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String statoDelega = statoDelega_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET2(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling DelegaUMCApi#stampaDelegheUsingGET2");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
String *codiceFiscale = codiceFiscale_example; //  (optional)
Date *dataFineA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataFineDa = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInizioDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *statoDelega = statoDelega_example; //  (optional)
Boolean *unpaged = true; //  (optional)

DelegaUMCApi *apiInstance = [[DelegaUMCApi alloc] init];

// Ritorna il pdf della lista paginata delle deleghe
[apiInstance stampaDelegheUsingGET2With:codiceFiscale
    dataFineA:dataFineA
    dataFineDa:dataFineDa
    dataInizioA:dataInizioA
    dataInizioDa:dataInizioDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    statoDelega:statoDelega
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPdfBean output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.DelegaUMCApi()
var opts = {
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'dataFineA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataFineDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInizioDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'statoDelega': statoDelega_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.stampaDelegheUsingGET2(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class stampaDelegheUsingGET2Example
    {
        public void main()
        {

            var apiInstance = new DelegaUMCApi();
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var dataFineA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataFineDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInizioDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var statoDelega = statoDelega_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna il pdf della lista paginata delle deleghe
                VfuRestResponseOfPdfBean result = apiInstance.stampaDelegheUsingGET2(codiceFiscale, dataFineA, dataFineDa, dataInizioA, dataInizioDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, statoDelega, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling DelegaUMCApi.stampaDelegheUsingGET2: " + e.Message );
            }
        }
    }
}
```





```
stampaDelegheUsingGET2($codiceFiscale, $dataFineA, $dataFineDa, $dataInizioA, $dataInizioDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $statoDelega, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling DelegaUMCApi->stampaDelegheUsingGET2: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::DelegaUMCApi;

my $api_instance = WWW::SwaggerClient::DelegaUMCApi->new();
my $codiceFiscale = codiceFiscale_example; # String |
my $dataFineA = 2013-10-20T19:20:30+01:00; # Date |
my $dataFineDa = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInizioDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $statoDelega = statoDelega_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->stampaDelegheUsingGET2(codiceFiscale => $codiceFiscale, dataFineA => $dataFineA, dataFineDa => $dataFineDa, dataInizioA => $dataInizioA, dataInizioDa => $dataInizioDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, statoDelega => $statoDelega, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling DelegaUMCApi->stampaDelegheUsingGET2: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.DelegaUMCApi()
codiceFiscale = codiceFiscale_example # String |  (optional)
dataFineA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataFineDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInizioDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
statoDelega = statoDelega_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna il pdf della lista paginata delle deleghe
    api_response = api_instance.stampa_deleghe_using_get2(codiceFiscale=codiceFiscale, dataFineA=dataFineA, dataFineDa=dataFineDa, dataInizioA=dataInizioA, dataInizioDa=dataInizioDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, statoDelega=statoDelega, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling DelegaUMCApi->stampaDelegheUsingGET2: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale |







                                                    String





                                 |


                                dataFineA |







                                                    Date


                                                        (date-time)





                                 |


                                dataFineDa |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInizioDa |







                                                    Date


                                                        (date-time)





                                 |


                                offset |







                                                    Long


                                                        (int64)





                                 |


                                pageNumber |







                                                    Integer


                                                        (int32)





                                 |


                                pageSize |







                                                    Integer


                                                        (int32)





                                 |


                                paged |







                                                    Boolean





                                 |


                                sort.sorted |







                                                    Boolean





                                 |


                                sort.unsorted |







                                                    Boolean





                                 |


                                statoDelega |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-stampaDelegheUsingGET2-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# FascicoloAgenzia





# consultaDocumentiUsingGET

                          Ritorna la lista dei documenti di un veicolo fuori uso visibile all'agenzia













```
/demolitori-aci-ws/rest/agenzia/consulta/documentoVFU/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-curl)

                          - [Java](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-java)

                          - [Android](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-android)


                          - [Obj-C](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-objc)

                          - [JavaScript](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-javascript)


                          - [C#](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-csharp)

                          - [PHP](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-php)

                          - [Perl](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-perl)

                          - [Python](#examples-FascicoloAgenzia-consultaDocumentiUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/agenzia/consulta/documentoVFU/{idVFU}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloAgenziaApi;

import java.io.File;
import java.util.*;

public class FascicoloAgenziaApiExample {

    public static void main(String[] args) {

        FascicoloAgenziaApi apiInstance = new FascicoloAgenziaApi();
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloAgenziaApi#consultaDocumentiUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloAgenziaApi;

public class FascicoloAgenziaApiExample {

    public static void main(String[] args) {
        FascicoloAgenziaApi apiInstance = new FascicoloAgenziaApi();
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloAgenziaApi#consultaDocumentiUsingGET");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idVFU = 789; // idVFU

FascicoloAgenziaApi *apiInstance = [[FascicoloAgenziaApi alloc] init];

// Ritorna la lista dei documenti di un veicolo fuori uso visibile all'agenzia
[apiInstance consultaDocumentiUsingGETWith:idVFU
              completionHandler: ^(VfuRestResponseOfListOfDocumentoVFU output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.FascicoloAgenziaApi()
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaDocumentiUsingGET(idVFU, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class consultaDocumentiUsingGETExample
    {
        public void main()
        {

            var apiInstance = new FascicoloAgenziaApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Ritorna la lista dei documenti di un veicolo fuori uso visibile all'agenzia
                VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloAgenziaApi.consultaDocumentiUsingGET: " + e.Message );
            }
        }
    }
}
```





```
consultaDocumentiUsingGET($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloAgenziaApi->consultaDocumentiUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloAgenziaApi;

my $api_instance = WWW::SwaggerClient::FascicoloAgenziaApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->consultaDocumentiUsingGET(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloAgenziaApi->consultaDocumentiUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloAgenziaApi()
idVFU = 789 # Long | idVFU

try:
    # Ritorna la lista dei documenti di un veicolo fuori uso visibile all'agenzia
    api_response = api_instance.consulta_documenti_using_get(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloAgenziaApi->consultaDocumentiUsingGET: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idVFU* |







                                                      Long


                                                          (int64)



                                                          idVFU



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaDocumentiUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# dettaglioFascicoloUsingGET

                          Ritorna il dettaglio di un fascicolo visibile all'agenzia













```
/demolitori-aci-ws/rest/agenzia/fascicolo/{idFascicolo}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-curl)

                          - [Java](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-java)

                          - [Android](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-android)


                          - [Obj-C](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-objc)

                          - [JavaScript](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-javascript)


                          - [C#](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-csharp)

                          - [PHP](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-php)

                          - [Perl](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-perl)

                          - [Python](#examples-FascicoloAgenzia-dettaglioFascicoloUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/agenzia/fascicolo/{idFascicolo}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloAgenziaApi;

import java.io.File;
import java.util.*;

public class FascicoloAgenziaApiExample {

    public static void main(String[] args) {

        FascicoloAgenziaApi apiInstance = new FascicoloAgenziaApi();
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloAgenziaApi#dettaglioFascicoloUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloAgenziaApi;

public class FascicoloAgenziaApiExample {

    public static void main(String[] args) {
        FascicoloAgenziaApi apiInstance = new FascicoloAgenziaApi();
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloAgenziaApi#dettaglioFascicoloUsingGET");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idFascicolo = 789; // idFascicolo

FascicoloAgenziaApi *apiInstance = [[FascicoloAgenziaApi alloc] init];

// Ritorna il dettaglio di un fascicolo visibile all'agenzia
[apiInstance dettaglioFascicoloUsingGETWith:idFascicolo
              completionHandler: ^(VfuRestResponseOfFascicoloVFU output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.FascicoloAgenziaApi()
var idFascicolo = 789; // {{Long}} idFascicolo

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.dettaglioFascicoloUsingGET(idFascicolo, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class dettaglioFascicoloUsingGETExample
    {
        public void main()
        {

            var apiInstance = new FascicoloAgenziaApi();
            var idFascicolo = 789;  // Long | idFascicolo

            try
            {
                // Ritorna il dettaglio di un fascicolo visibile all'agenzia
                VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET(idFascicolo);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloAgenziaApi.dettaglioFascicoloUsingGET: " + e.Message );
            }
        }
    }
}
```





```
dettaglioFascicoloUsingGET($idFascicolo);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloAgenziaApi->dettaglioFascicoloUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloAgenziaApi;

my $api_instance = WWW::SwaggerClient::FascicoloAgenziaApi->new();
my $idFascicolo = 789; # Long | idFascicolo

eval {
    my $result = $api_instance->dettaglioFascicoloUsingGET(idFascicolo => $idFascicolo);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloAgenziaApi->dettaglioFascicoloUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloAgenziaApi()
idFascicolo = 789 # Long | idFascicolo

try:
    # Ritorna il dettaglio di un fascicolo visibile all'agenzia
    api_response = api_instance.dettaglio_fascicolo_using_get(idFascicolo)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloAgenziaApi->dettaglioFascicoloUsingGET: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idFascicolo* |







                                                      Long


                                                          (int64)



                                                          idFascicolo



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-dettaglioFascicoloUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# downloadDocumentoVfuUsingGET

                          Permette di scaricare un documento di un veicolo fuori uso













```
/demolitori-aci-ws/rest/agenzia/documentoVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-curl)

                          - [Java](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-java)

                          - [Android](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-android)


                          - [Obj-C](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-objc)

                          - [JavaScript](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-javascript)


                          - [C#](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-csharp)

                          - [PHP](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-php)

                          - [Perl](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-perl)

                          - [Python](#examples-FascicoloAgenzia-downloadDocumentoVfuUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/agenzia/documentoVFU?idAci=&idFascicolo=&progressivoDocumento="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloAgenziaApi;

import java.io.File;
import java.util.*;

public class FascicoloAgenziaApiExample {

    public static void main(String[] args) {

        FascicoloAgenziaApi apiInstance = new FascicoloAgenziaApi();
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloAgenziaApi#downloadDocumentoVfuUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloAgenziaApi;

public class FascicoloAgenziaApiExample {

    public static void main(String[] args) {
        FascicoloAgenziaApi apiInstance = new FascicoloAgenziaApi();
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloAgenziaApi#downloadDocumentoVfuUsingGET");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
Long *idAci = 789; //  (optional)
Long *idFascicolo = 789; //  (optional)
Long *progressivoDocumento = 789; //  (optional)

FascicoloAgenziaApi *apiInstance = [[FascicoloAgenziaApi alloc] init];

// Permette di scaricare un documento di un veicolo fuori uso
[apiInstance downloadDocumentoVfuUsingGETWith:idAci
    idFascicolo:idFascicolo
    progressivoDocumento:progressivoDocumento
              completionHandler: ^(VfuRestResponseOfDocumentoVFU output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.FascicoloAgenziaApi()
var opts = {
  'idAci': 789, // {{Long}}
  'idFascicolo': 789, // {{Long}}
  'progressivoDocumento': 789 // {{Long}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.downloadDocumentoVfuUsingGET(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class downloadDocumentoVfuUsingGETExample
    {
        public void main()
        {

            var apiInstance = new FascicoloAgenziaApi();
            var idAci = 789;  // Long |  (optional)
            var idFascicolo = 789;  // Long |  (optional)
            var progressivoDocumento = 789;  // Long |  (optional)

            try
            {
                // Permette di scaricare un documento di un veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET(idAci, idFascicolo, progressivoDocumento);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloAgenziaApi.downloadDocumentoVfuUsingGET: " + e.Message );
            }
        }
    }
}
```





```
downloadDocumentoVfuUsingGET($idAci, $idFascicolo, $progressivoDocumento);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloAgenziaApi->downloadDocumentoVfuUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloAgenziaApi;

my $api_instance = WWW::SwaggerClient::FascicoloAgenziaApi->new();
my $idAci = 789; # Long |
my $idFascicolo = 789; # Long |
my $progressivoDocumento = 789; # Long |

eval {
    my $result = $api_instance->downloadDocumentoVfuUsingGET(idAci => $idAci, idFascicolo => $idFascicolo, progressivoDocumento => $progressivoDocumento);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloAgenziaApi->downloadDocumentoVfuUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloAgenziaApi()
idAci = 789 # Long |  (optional)
idFascicolo = 789 # Long |  (optional)
progressivoDocumento = 789 # Long |  (optional)

try:
    # Permette di scaricare un documento di un veicolo fuori uso
    api_response = api_instance.download_documento_vfu_using_get(idAci=idAci, idFascicolo=idFascicolo, progressivoDocumento=progressivoDocumento)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloAgenziaApi->downloadDocumentoVfuUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                idAci |







                                                    Long


                                                        (int64)





                                 |


                                idFascicolo |







                                                    Long


                                                        (int64)





                                 |


                                progressivoDocumento |







                                                    Long


                                                        (int64)





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-downloadDocumentoVfuUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# FascicoloCR





# aggiornaDocumentoVFUUsingPUT

                          Permette di sostituire un documento di un veicolo fuori uso













```
/demolitori-aci-ws/rest/cr/documentoVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-curl)

                          - [Java](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-java)

                          - [Android](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-android)


                          - [Obj-C](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-objc)

                          - [JavaScript](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-javascript)


                          - [C#](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-csharp)

                          - [PHP](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-php)

                          - [Perl](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-perl)

                          - [Python](#examples-FascicoloCR-aggiornaDocumentoVFUUsingPUT-0-python)






```
curl -X PUT\
-H "Accept: */*"\
-H "Content-Type: application/json"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/documentoVFU"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloCRApi;

import java.io.File;
import java.util.*;

public class FascicoloCRApiExample {

    public static void main(String[] args) {

        FascicoloCRApi apiInstance = new FascicoloCRApi();
        DocumentoVFUReq body = ; // DocumentoVFUReq |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.aggiornaDocumentoVFUUsingPUT(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#aggiornaDocumentoVFUUsingPUT");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloCRApi;

public class FascicoloCRApiExample {

    public static void main(String[] args) {
        FascicoloCRApi apiInstance = new FascicoloCRApi();
        DocumentoVFUReq body = ; // DocumentoVFUReq |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.aggiornaDocumentoVFUUsingPUT(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#aggiornaDocumentoVFUUsingPUT");
            e.printStackTrace();
        }
    }
}
```




```
Coming Soon!
```

   -->


```
DocumentoVFUReq *body = ; //  (optional)

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette di sostituire un documento di un veicolo fuori uso
[apiInstance aggiornaDocumentoVFUUsingPUTWith:body
              completionHandler: ^(VfuRestResponseOfDocumentoVFU output, NSError* error) {
                            if (output) {
                                NSLog(@"%@", output);
                            }
                            if (error) {
                                NSLog(@"Error: %@", error);
                            }
                        }];
```





```
var ApiDocumentation = require('api_documentation');

var api = new ApiDocumentation.FascicoloCRApi()
var opts = {
  'body':  // {{DocumentoVFUReq}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.aggiornaDocumentoVFUUsingPUT(opts, callback);
```





```
Coming Soon!
```

            -->


```
using System;
using System.Diagnostics;
using IO.Swagger.Api;
using IO.Swagger.Client;
using IO.Swagger.Model;

namespace Example
{
    public class aggiornaDocumentoVFUUsingPUTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var body = new DocumentoVFUReq(); // DocumentoVFUReq |  (optional)

            try
            {
                // Permette di sostituire un documento di un veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.aggiornaDocumentoVFUUsingPUT(body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.aggiornaDocumentoVFUUsingPUT: " + e.Message );
            }
        }
    }
}
```





```
aggiornaDocumentoVFUUsingPUT($body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->aggiornaDocumentoVFUUsingPUT: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $body = WWW::SwaggerClient::Object::DocumentoVFUReq->new(); # DocumentoVFUReq |

eval {
    my $result = $api_instance->aggiornaDocumentoVFUUsingPUT(body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->aggiornaDocumentoVFUUsingPUT: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloCRApi()
body =  # DocumentoVFUReq |  (optional)

try:
    # Permette di sostituire un documento di un veicolo fuori uso
    api_response = api_instance.aggiorna_documento_vfu_using_put(body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->aggiornaDocumentoVFUUsingPUT: %s\n" % e)
```





## Parameters

                            Body parameters



                                Name |
                                Description |


                                body  |





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-aggiornaDocumentoVFUUsingPUT-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# allegaDocumentoUsingPOST

                          Permette di allegare un documento
