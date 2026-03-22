# 03 Endpoints Fascicolo

fascicolo visibile all'agenzia













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
