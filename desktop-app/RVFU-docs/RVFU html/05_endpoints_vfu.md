# 05 Endpoints Vfu

VFU













```
/demolitori-aci-ws/rest/cr/allega/documentoVFU/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-curl)

                          - [Java](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-java)

                          - [Android](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-android)


                          - [Obj-C](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-objc)

                          - [JavaScript](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-javascript)


                          - [C#](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-csharp)

                          - [PHP](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-php)

                          - [Perl](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-perl)

                          - [Python](#examples-FascicoloCR-allegaDocumentoUsingPOST-0-python)






```
curl -X POST\
-H "Accept: */*"\
-H "Content-Type: application/json"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/allega/documentoVFU/{idVFU}"
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
        Long idVFU = 789; // Long | idVFU
        DocumentoVFUCreate body = ; // DocumentoVFUCreate |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.allegaDocumentoUsingPOST(idVFU, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#allegaDocumentoUsingPOST");
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
        Long idVFU = 789; // Long | idVFU
        DocumentoVFUCreate body = ; // DocumentoVFUCreate |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.allegaDocumentoUsingPOST(idVFU, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#allegaDocumentoUsingPOST");
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
DocumentoVFUCreate *body = ; //  (optional)

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette di allegare un documento VFU
[apiInstance allegaDocumentoUsingPOSTWith:idVFU
    body:body
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
var idVFU = 789; // {{Long}} idVFU
var opts = {
  'body':  // {{DocumentoVFUCreate}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.allegaDocumentoUsingPOST(idVFU, opts, callback);
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
    public class allegaDocumentoUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idVFU = 789;  // Long | idVFU
            var body = new DocumentoVFUCreate(); // DocumentoVFUCreate |  (optional)

            try
            {
                // Permette di allegare un documento VFU
                VfuRestResponseOfDocumentoVFU result = apiInstance.allegaDocumentoUsingPOST(idVFU, body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.allegaDocumentoUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
allegaDocumentoUsingPOST($idVFU, $body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->allegaDocumentoUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idVFU = 789; # Long | idVFU
my $body = WWW::SwaggerClient::Object::DocumentoVFUCreate->new(); # DocumentoVFUCreate |

eval {
    my $result = $api_instance->allegaDocumentoUsingPOST(idVFU => $idVFU, body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->allegaDocumentoUsingPOST: $@\n";
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
idVFU = 789 # Long | idVFU
body =  # DocumentoVFUCreate |  (optional)

try:
    # Permette di allegare un documento VFU
    api_response = api_instance.allega_documento_using_post(idVFU, body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->allegaDocumentoUsingPOST: %s\n" % e)
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




                            Body parameters



                                Name |
                                Description |


                                body  |





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-allegaDocumentoUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# annullaAndClonaCartellaFirmaVFUUsingDELETE

                          Annulla cartella firma e crea nuova cartella con gli stessi documenti













```
/demolitori-aci-ws/rest/cr/cartellaFirma/{idCartella}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-curl)

                          - [Java](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-java)

                          - [Android](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-android)


                          - [Obj-C](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-objc)

                          - [JavaScript](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-javascript)


                          - [C#](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-csharp)

                          - [PHP](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-php)

                          - [Perl](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-perl)

                          - [Python](#examples-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE-0-python)






```
curl -X DELETE\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/cartellaFirma/{idCartella}"
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
        Long idCartella = 789; // Long | idCartella
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.annullaAndClonaCartellaFirmaVFUUsingDELETE(idCartella);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#annullaAndClonaCartellaFirmaVFUUsingDELETE");
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
        Long idCartella = 789; // Long | idCartella
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.annullaAndClonaCartellaFirmaVFUUsingDELETE(idCartella);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#annullaAndClonaCartellaFirmaVFUUsingDELETE");
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
Long *idCartella = 789; // idCartella

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Annulla cartella firma e crea nuova cartella con gli stessi documenti
[apiInstance annullaAndClonaCartellaFirmaVFUUsingDELETEWith:idCartella
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

var api = new ApiDocumentation.FascicoloCRApi()
var idCartella = 789; // {{Long}} idCartella

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.annullaAndClonaCartellaFirmaVFUUsingDELETE(idCartella, callback);
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
    public class annullaAndClonaCartellaFirmaVFUUsingDELETEExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idCartella = 789;  // Long | idCartella

            try
            {
                // Annulla cartella firma e crea nuova cartella con gli stessi documenti
                VfuRestResponseOfFascicoloVFU result = apiInstance.annullaAndClonaCartellaFirmaVFUUsingDELETE(idCartella);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.annullaAndClonaCartellaFirmaVFUUsingDELETE: " + e.Message );
            }
        }
    }
}
```





```
annullaAndClonaCartellaFirmaVFUUsingDELETE($idCartella);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->annullaAndClonaCartellaFirmaVFUUsingDELETE: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idCartella = 789; # Long | idCartella

eval {
    my $result = $api_instance->annullaAndClonaCartellaFirmaVFUUsingDELETE(idCartella => $idCartella);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->annullaAndClonaCartellaFirmaVFUUsingDELETE: $@\n";
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
idCartella = 789 # Long | idCartella

try:
    # Annulla cartella firma e crea nuova cartella con gli stessi documenti
    api_response = api_instance.annulla_and_clona_cartella_firma_vfu_using_delete(idCartella)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->annullaAndClonaCartellaFirmaVFUUsingDELETE: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idCartella* |







                                                      Long


                                                          (int64)



                                                          idCartella



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-annullaAndClonaCartellaFirmaVFUUsingDELETE-200-schema)














###  Status: 204 - No Content









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden















# chiudiFascicoloUsingPUT

                          Permette la chiusura di un fascicolo













```
/demolitori-aci-ws/rest/cr/chiudi/fascicolo/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-curl)

                          - [Java](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-java)

                          - [Android](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-android)


                          - [Obj-C](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-objc)

                          - [JavaScript](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-javascript)


                          - [C#](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-csharp)

                          - [PHP](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-php)

                          - [Perl](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-perl)

                          - [Python](#examples-FascicoloCR-chiudiFascicoloUsingPUT-0-python)






```
curl -X PUT\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/chiudi/fascicolo/{idVFU}"
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.chiudiFascicoloUsingPUT(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#chiudiFascicoloUsingPUT");
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.chiudiFascicoloUsingPUT(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#chiudiFascicoloUsingPUT");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette la chiusura di un fascicolo
[apiInstance chiudiFascicoloUsingPUTWith:idVFU
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

var api = new ApiDocumentation.FascicoloCRApi()
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.chiudiFascicoloUsingPUT(idVFU, callback);
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
    public class chiudiFascicoloUsingPUTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Permette la chiusura di un fascicolo
                VfuRestResponseOfFascicoloVFU result = apiInstance.chiudiFascicoloUsingPUT(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.chiudiFascicoloUsingPUT: " + e.Message );
            }
        }
    }
}
```





```
chiudiFascicoloUsingPUT($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->chiudiFascicoloUsingPUT: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->chiudiFascicoloUsingPUT(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->chiudiFascicoloUsingPUT: $@\n";
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
idVFU = 789 # Long | idVFU

try:
    # Permette la chiusura di un fascicolo
    api_response = api_instance.chiudi_fascicolo_using_put(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->chiudiFascicoloUsingPUT: %s\n" % e)
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
                                  [Schema](#responses-chiudiFascicoloUsingPUT-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# consultaDocumentiUsingGET2

                          Ritorna la lista delle informazioni dei documenti del veicolo fuori uso













```
/demolitori-aci-ws/rest/cr/consulta/documentoVFU/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-curl)

                          - [Java](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-java)

                          - [Android](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-android)


                          - [Obj-C](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-objc)

                          - [JavaScript](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-javascript)


                          - [C#](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-csharp)

                          - [PHP](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-php)

                          - [Perl](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-perl)

                          - [Python](#examples-FascicoloCR-consultaDocumentiUsingGET2-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/consulta/documentoVFU/{idVFU}"
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET2(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#consultaDocumentiUsingGET2");
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET2(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#consultaDocumentiUsingGET2");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
[apiInstance consultaDocumentiUsingGET2With:idVFU
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

var api = new ApiDocumentation.FascicoloCRApi()
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaDocumentiUsingGET2(idVFU, callback);
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
    public class consultaDocumentiUsingGET2Example
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
                VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET2(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.consultaDocumentiUsingGET2: " + e.Message );
            }
        }
    }
}
```





```
consultaDocumentiUsingGET2($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->consultaDocumentiUsingGET2: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->consultaDocumentiUsingGET2(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->consultaDocumentiUsingGET2: $@\n";
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
idVFU = 789 # Long | idVFU

try:
    # Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
    api_response = api_instance.consulta_documenti_using_get2(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->consultaDocumentiUsingGET2: %s\n" % e)
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
                                  [Schema](#responses-consultaDocumentiUsingGET2-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# dettaglioFascicoloUsingGET1

                          Ritorna il dettaglio di un fascicolo













```
/demolitori-aci-ws/rest/cr/fascicolo/{idFascicolo}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-curl)

                          - [Java](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-java)

                          - [Android](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-android)


                          - [Obj-C](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-objc)

                          - [JavaScript](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-javascript)


                          - [C#](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-csharp)

                          - [PHP](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-php)

                          - [Perl](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-perl)

                          - [Python](#examples-FascicoloCR-dettaglioFascicoloUsingGET1-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/fascicolo/{idFascicolo}"
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
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET1(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#dettaglioFascicoloUsingGET1");
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
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET1(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#dettaglioFascicoloUsingGET1");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Ritorna il dettaglio di un fascicolo
[apiInstance dettaglioFascicoloUsingGET1With:idFascicolo
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

var api = new ApiDocumentation.FascicoloCRApi()
var idFascicolo = 789; // {{Long}} idFascicolo

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.dettaglioFascicoloUsingGET1(idFascicolo, callback);
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
    public class dettaglioFascicoloUsingGET1Example
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idFascicolo = 789;  // Long | idFascicolo

            try
            {
                // Ritorna il dettaglio di un fascicolo
                VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET1(idFascicolo);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.dettaglioFascicoloUsingGET1: " + e.Message );
            }
        }
    }
}
```





```
dettaglioFascicoloUsingGET1($idFascicolo);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->dettaglioFascicoloUsingGET1: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idFascicolo = 789; # Long | idFascicolo

eval {
    my $result = $api_instance->dettaglioFascicoloUsingGET1(idFascicolo => $idFascicolo);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->dettaglioFascicoloUsingGET1: $@\n";
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
idFascicolo = 789 # Long | idFascicolo

try:
    # Ritorna il dettaglio di un fascicolo
    api_response = api_instance.dettaglio_fascicolo_using_get1(idFascicolo)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->dettaglioFascicoloUsingGET1: %s\n" % e)
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
                                  [Schema](#responses-dettaglioFascicoloUsingGET1-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# downloadDocumentoVfuUsingGET2

                          Permette di scaricare un documento di un veicolo fuori uso













```
/demolitori-aci-ws/rest/cr/documentoVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-curl)

                          - [Java](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-java)

                          - [Android](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-android)


                          - [Obj-C](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-objc)

                          - [JavaScript](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-javascript)


                          - [C#](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-csharp)

                          - [PHP](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-php)

                          - [Perl](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-perl)

                          - [Python](#examples-FascicoloCR-downloadDocumentoVfuUsingGET2-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/documentoVFU?idAci=&idFascicolo=&progressivoDocumento="
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
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET2(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#downloadDocumentoVfuUsingGET2");
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
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET2(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#downloadDocumentoVfuUsingGET2");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette di scaricare un documento di un veicolo fuori uso
[apiInstance downloadDocumentoVfuUsingGET2With:idAci
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

var api = new ApiDocumentation.FascicoloCRApi()
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
api.downloadDocumentoVfuUsingGET2(opts, callback);
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
    public class downloadDocumentoVfuUsingGET2Example
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idAci = 789;  // Long |  (optional)
            var idFascicolo = 789;  // Long |  (optional)
            var progressivoDocumento = 789;  // Long |  (optional)

            try
            {
                // Permette di scaricare un documento di un veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET2(idAci, idFascicolo, progressivoDocumento);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.downloadDocumentoVfuUsingGET2: " + e.Message );
            }
        }
    }
}
```





```
downloadDocumentoVfuUsingGET2($idAci, $idFascicolo, $progressivoDocumento);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->downloadDocumentoVfuUsingGET2: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idAci = 789; # Long |
my $idFascicolo = 789; # Long |
my $progressivoDocumento = 789; # Long |

eval {
    my $result = $api_instance->downloadDocumentoVfuUsingGET2(idAci => $idAci, idFascicolo => $idFascicolo, progressivoDocumento => $progressivoDocumento);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->downloadDocumentoVfuUsingGET2: $@\n";
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
idAci = 789 # Long |  (optional)
idFascicolo = 789 # Long |  (optional)
progressivoDocumento = 789 # Long |  (optional)

try:
    # Permette di scaricare un documento di un veicolo fuori uso
    api_response = api_instance.download_documento_vfu_using_get2(idAci=idAci, idFascicolo=idFascicolo, progressivoDocumento=progressivoDocumento)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->downloadDocumentoVfuUsingGET2: %s\n" % e)
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
                                  [Schema](#responses-downloadDocumentoVfuUsingGET2-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# eliminaDocumentoVFUUsingPOST

                          Permette di eliminare un documento di un veicolo fuori uso













```
/demolitori-aci-ws/rest/cr/documentoVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-curl)

                          - [Java](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-java)

                          - [Android](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-android)


                          - [Obj-C](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-objc)

                          - [JavaScript](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-javascript)


                          - [C#](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-csharp)

                          - [PHP](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-php)

                          - [Perl](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-perl)

                          - [Python](#examples-FascicoloCR-eliminaDocumentoVFUUsingPOST-0-python)






```
curl -X POST\
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
        CriteriRicercaDocumento body = ; // CriteriRicercaDocumento |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.eliminaDocumentoVFUUsingPOST(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#eliminaDocumentoVFUUsingPOST");
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
        CriteriRicercaDocumento body = ; // CriteriRicercaDocumento |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.eliminaDocumentoVFUUsingPOST(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#eliminaDocumentoVFUUsingPOST");
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
CriteriRicercaDocumento *body = ; //  (optional)

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette di eliminare un documento di un veicolo fuori uso
[apiInstance eliminaDocumentoVFUUsingPOSTWith:body
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
  'body':  // {{CriteriRicercaDocumento}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.eliminaDocumentoVFUUsingPOST(opts, callback);
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
    public class eliminaDocumentoVFUUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var body = new CriteriRicercaDocumento(); // CriteriRicercaDocumento |  (optional)

            try
            {
                // Permette di eliminare un documento di un veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.eliminaDocumentoVFUUsingPOST(body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.eliminaDocumentoVFUUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
eliminaDocumentoVFUUsingPOST($body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->eliminaDocumentoVFUUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $body = WWW::SwaggerClient::Object::CriteriRicercaDocumento->new(); # CriteriRicercaDocumento |

eval {
    my $result = $api_instance->eliminaDocumentoVFUUsingPOST(body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->eliminaDocumentoVFUUsingPOST: $@\n";
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
body =  # CriteriRicercaDocumento |  (optional)

try:
    # Permette di eliminare un documento di un veicolo fuori uso
    api_response = api_instance.elimina_documento_vfu_using_post(body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->eliminaDocumentoVFUUsingPOST: %s\n" % e)
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
                                  [Schema](#responses-eliminaDocumentoVFUUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# generaCertificatoRottamazioneUsingPOST

                          Permette di generare il certificato di rottamazione del veicolo fuori uso













```
/demolitori-aci-ws/rest/cr/genera/certificatoRottamazione/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-curl)

                          - [Java](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-java)

                          - [Android](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-android)


                          - [Obj-C](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-objc)

                          - [JavaScript](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-javascript)


                          - [C#](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-csharp)

                          - [PHP](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-php)

                          - [Perl](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-perl)

                          - [Python](#examples-FascicoloCR-generaCertificatoRottamazioneUsingPOST-0-python)






```
curl -X POST\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/genera/certificatoRottamazione/{idVFU}"
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.generaCertificatoRottamazioneUsingPOST(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#generaCertificatoRottamazioneUsingPOST");
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.generaCertificatoRottamazioneUsingPOST(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#generaCertificatoRottamazioneUsingPOST");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette di generare il certificato di rottamazione del veicolo fuori uso
[apiInstance generaCertificatoRottamazioneUsingPOSTWith:idVFU
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
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.generaCertificatoRottamazioneUsingPOST(idVFU, callback);
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
    public class generaCertificatoRottamazioneUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Permette di generare il certificato di rottamazione del veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.generaCertificatoRottamazioneUsingPOST(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.generaCertificatoRottamazioneUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
generaCertificatoRottamazioneUsingPOST($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->generaCertificatoRottamazioneUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->generaCertificatoRottamazioneUsingPOST(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->generaCertificatoRottamazioneUsingPOST: $@\n";
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
idVFU = 789 # Long | idVFU

try:
    # Permette di generare il certificato di rottamazione del veicolo fuori uso
    api_response = api_instance.genera_certificato_rottamazione_using_post(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->generaCertificatoRottamazioneUsingPOST: %s\n" % e)
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
                                  [Schema](#responses-generaCertificatoRottamazioneUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# generaPostillaCdrUsingPOST

                          Aggiunge postilla al CdR













```
/demolitori-aci-ws/rest/cr/genera/postillaCdr/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-curl)

                          - [Java](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-java)

                          - [Android](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-android)


                          - [Obj-C](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-objc)

                          - [JavaScript](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-javascript)


                          - [C#](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-csharp)

                          - [PHP](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-php)

                          - [Perl](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-perl)

                          - [Python](#examples-FascicoloCR-generaPostillaCdrUsingPOST-0-python)






```
curl -X POST\
-H "Accept: */*"\
-H "Content-Type: application/json"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/genera/postillaCdr/{idVFU}"
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
        Long idVFU = 789; // Long | idVFU
        PostillaCdrCreate body = ; // PostillaCdrCreate |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.generaPostillaCdrUsingPOST(idVFU, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#generaPostillaCdrUsingPOST");
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
        Long idVFU = 789; // Long | idVFU
        PostillaCdrCreate body = ; // PostillaCdrCreate |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.generaPostillaCdrUsingPOST(idVFU, body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#generaPostillaCdrUsingPOST");
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
PostillaCdrCreate *body = ; //  (optional)

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Aggiunge postilla al CdR
[apiInstance generaPostillaCdrUsingPOSTWith:idVFU
    body:body
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
var idVFU = 789; // {{Long}} idVFU
var opts = {
  'body':  // {{PostillaCdrCreate}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.generaPostillaCdrUsingPOST(idVFU, opts, callback);
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
    public class generaPostillaCdrUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idVFU = 789;  // Long | idVFU
            var body = new PostillaCdrCreate(); // PostillaCdrCreate |  (optional)

            try
            {
                // Aggiunge postilla al CdR
                VfuRestResponseOfDocumentoVFU result = apiInstance.generaPostillaCdrUsingPOST(idVFU, body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.generaPostillaCdrUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
generaPostillaCdrUsingPOST($idVFU, $body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->generaPostillaCdrUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idVFU = 789; # Long | idVFU
my $body = WWW::SwaggerClient::Object::PostillaCdrCreate->new(); # PostillaCdrCreate |

eval {
    my $result = $api_instance->generaPostillaCdrUsingPOST(idVFU => $idVFU, body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->generaPostillaCdrUsingPOST: $@\n";
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
idVFU = 789 # Long | idVFU
body =  # PostillaCdrCreate |  (optional)

try:
    # Aggiunge postilla al CdR
    api_response = api_instance.genera_postilla_cdr_using_post(idVFU, body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->generaPostillaCdrUsingPOST: %s\n" % e)
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




                            Body parameters



                                Name |
                                Description |


                                body  |





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-generaPostillaCdrUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# generaRicevutaPresaInCaricoUsingPOST

                          Permette di generare la ricevuta di presa in carico del veicolo fuori uso













```
/demolitori-aci-ws/rest/cr/genera/ricevutaPresaInCarico/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-curl)

                          - [Java](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-java)

                          - [Android](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-android)


                          - [Obj-C](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-objc)

                          - [JavaScript](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-javascript)


                          - [C#](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-csharp)

                          - [PHP](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-php)

                          - [Perl](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-perl)

                          - [Python](#examples-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST-0-python)






```
curl -X POST\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/genera/ricevutaPresaInCarico/{idVFU}"
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.generaRicevutaPresaInCaricoUsingPOST(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#generaRicevutaPresaInCaricoUsingPOST");
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.generaRicevutaPresaInCaricoUsingPOST(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#generaRicevutaPresaInCaricoUsingPOST");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette di generare la ricevuta di presa in carico del veicolo fuori uso
[apiInstance generaRicevutaPresaInCaricoUsingPOSTWith:idVFU
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
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.generaRicevutaPresaInCaricoUsingPOST(idVFU, callback);
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
    public class generaRicevutaPresaInCaricoUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Permette di generare la ricevuta di presa in carico del veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.generaRicevutaPresaInCaricoUsingPOST(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.generaRicevutaPresaInCaricoUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
generaRicevutaPresaInCaricoUsingPOST($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->generaRicevutaPresaInCaricoUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->generaRicevutaPresaInCaricoUsingPOST(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->generaRicevutaPresaInCaricoUsingPOST: $@\n";
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
idVFU = 789 # Long | idVFU

try:
    # Permette di generare la ricevuta di presa in carico del veicolo fuori uso
    api_response = api_instance.genera_ricevuta_presa_in_carico_using_post(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->generaRicevutaPresaInCaricoUsingPOST: %s\n" % e)
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
                                  [Schema](#responses-generaRicevutaPresaInCaricoUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# inviaAlTabletUsingPUT

                          Permette di inviare al tablet i documenti allegati













```
/demolitori-aci-ws/rest/cr/inviaAlTablet/{idFascicolo}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-curl)

                          - [Java](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-java)

                          - [Android](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-android)


                          - [Obj-C](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-objc)

                          - [JavaScript](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-javascript)


                          - [C#](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-csharp)

                          - [PHP](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-php)

                          - [Perl](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-perl)

                          - [Python](#examples-FascicoloCR-inviaAlTabletUsingPUT-0-python)






```
curl -X PUT\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/inviaAlTablet/{idFascicolo}"
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
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.inviaAlTabletUsingPUT(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#inviaAlTabletUsingPUT");
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
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.inviaAlTabletUsingPUT(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#inviaAlTabletUsingPUT");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette di inviare al tablet i documenti allegati
[apiInstance inviaAlTabletUsingPUTWith:idFascicolo
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
var idFascicolo = 789; // {{Long}} idFascicolo

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.inviaAlTabletUsingPUT(idFascicolo, callback);
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
    public class inviaAlTabletUsingPUTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idFascicolo = 789;  // Long | idFascicolo

            try
            {
                // Permette di inviare al tablet i documenti allegati
                VfuRestResponseOfDocumentoVFU result = apiInstance.inviaAlTabletUsingPUT(idFascicolo);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.inviaAlTabletUsingPUT: " + e.Message );
            }
        }
    }
}
```





```
inviaAlTabletUsingPUT($idFascicolo);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->inviaAlTabletUsingPUT: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idFascicolo = 789; # Long | idFascicolo

eval {
    my $result = $api_instance->inviaAlTabletUsingPUT(idFascicolo => $idFascicolo);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->inviaAlTabletUsingPUT: $@\n";
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
idFascicolo = 789 # Long | idFascicolo

try:
    # Permette di inviare al tablet i documenti allegati
    api_response = api_instance.invia_al_tablet_using_put(idFascicolo)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->inviaAlTabletUsingPUT: %s\n" % e)
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
                                  [Schema](#responses-inviaAlTabletUsingPUT-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# riapriFascicoloUsingPUT

                          Permette la riapertura di un fascicolo













```
/demolitori-aci-ws/rest/cr/riapri/fascicolo/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-curl)

                          - [Java](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-java)

                          - [Android](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-android)


                          - [Obj-C](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-objc)

                          - [JavaScript](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-javascript)


                          - [C#](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-csharp)

                          - [PHP](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-php)

                          - [Perl](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-perl)

                          - [Python](#examples-FascicoloCR-riapriFascicoloUsingPUT-0-python)






```
curl -X PUT\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/riapri/fascicolo/{idVFU}"
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.riapriFascicoloUsingPUT(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#riapriFascicoloUsingPUT");
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
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.riapriFascicoloUsingPUT(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#riapriFascicoloUsingPUT");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette la riapertura di un fascicolo
[apiInstance riapriFascicoloUsingPUTWith:idVFU
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

var api = new ApiDocumentation.FascicoloCRApi()
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.riapriFascicoloUsingPUT(idVFU, callback);
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
    public class riapriFascicoloUsingPUTExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Permette la riapertura di un fascicolo
                VfuRestResponseOfFascicoloVFU result = apiInstance.riapriFascicoloUsingPUT(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.riapriFascicoloUsingPUT: " + e.Message );
            }
        }
    }
}
```





```
riapriFascicoloUsingPUT($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->riapriFascicoloUsingPUT: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->riapriFascicoloUsingPUT(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->riapriFascicoloUsingPUT: $@\n";
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
idVFU = 789 # Long | idVFU

try:
    # Permette la riapertura di un fascicolo
    api_response = api_instance.riapri_fascicolo_using_put(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->riapriFascicoloUsingPUT: %s\n" % e)
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
                                  [Schema](#responses-riapriFascicoloUsingPUT-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# verificaFascicoloUsingGET

                          Permette la verifica di un fascicolo













```
/demolitori-aci-ws/rest/cr/verifica/fascicolo/{idFascicolo}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloCR-verificaFascicoloUsingGET-0-curl)

                          - [Java](#examples-FascicoloCR-verificaFascicoloUsingGET-0-java)

                          - [Android](#examples-FascicoloCR-verificaFascicoloUsingGET-0-android)


                          - [Obj-C](#examples-FascicoloCR-verificaFascicoloUsingGET-0-objc)

                          - [JavaScript](#examples-FascicoloCR-verificaFascicoloUsingGET-0-javascript)


                          - [C#](#examples-FascicoloCR-verificaFascicoloUsingGET-0-csharp)

                          - [PHP](#examples-FascicoloCR-verificaFascicoloUsingGET-0-php)

                          - [Perl](#examples-FascicoloCR-verificaFascicoloUsingGET-0-perl)

                          - [Python](#examples-FascicoloCR-verificaFascicoloUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/verifica/fascicolo/{idFascicolo}"
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
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfboolean result = apiInstance.verificaFascicoloUsingGET(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#verificaFascicoloUsingGET");
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
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfboolean result = apiInstance.verificaFascicoloUsingGET(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloCRApi#verificaFascicoloUsingGET");
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

FascicoloCRApi *apiInstance = [[FascicoloCRApi alloc] init];

// Permette la verifica di un fascicolo
[apiInstance verificaFascicoloUsingGETWith:idFascicolo
              completionHandler: ^(VfuRestResponseOfboolean output, NSError* error) {
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
var idFascicolo = 789; // {{Long}} idFascicolo

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.verificaFascicoloUsingGET(idFascicolo, callback);
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
    public class verificaFascicoloUsingGETExample
    {
        public void main()
        {

            var apiInstance = new FascicoloCRApi();
            var idFascicolo = 789;  // Long | idFascicolo

            try
            {
                // Permette la verifica di un fascicolo
                VfuRestResponseOfboolean result = apiInstance.verificaFascicoloUsingGET(idFascicolo);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloCRApi.verificaFascicoloUsingGET: " + e.Message );
            }
        }
    }
}
```





```
verificaFascicoloUsingGET($idFascicolo);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloCRApi->verificaFascicoloUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloCRApi;

my $api_instance = WWW::SwaggerClient::FascicoloCRApi->new();
my $idFascicolo = 789; # Long | idFascicolo

eval {
    my $result = $api_instance->verificaFascicoloUsingGET(idFascicolo => $idFascicolo);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloCRApi->verificaFascicoloUsingGET: $@\n";
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
idFascicolo = 789 # Long | idFascicolo

try:
    # Permette la verifica di un fascicolo
    api_response = api_instance.verifica_fascicolo_using_get(idFascicolo)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloCRApi->verificaFascicoloUsingGET: %s\n" % e)
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
                                  [Schema](#responses-verificaFascicoloUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# FascicoloConcessionario





# consultaDocumentiUsingGET1

                          Ritorna la lista delle informazioni dei documenti del veicolo fuori uso













```
/demolitori-aci-ws/rest/concessionario/consulta/documentoVFU/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-curl)

                          - [Java](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-java)

                          - [Android](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-android)


                          - [Obj-C](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-objc)

                          - [JavaScript](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-javascript)


                          - [C#](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-csharp)

                          - [PHP](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-php)

                          - [Perl](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-perl)

                          - [Python](#examples-FascicoloConcessionario-consultaDocumentiUsingGET1-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/concessionario/consulta/documentoVFU/{idVFU}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloConcessionarioApi;

import java.io.File;
import java.util.*;

public class FascicoloConcessionarioApiExample {

    public static void main(String[] args) {

        FascicoloConcessionarioApi apiInstance = new FascicoloConcessionarioApi();
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET1(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloConcessionarioApi#consultaDocumentiUsingGET1");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloConcessionarioApi;

public class FascicoloConcessionarioApiExample {

    public static void main(String[] args) {
        FascicoloConcessionarioApi apiInstance = new FascicoloConcessionarioApi();
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET1(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloConcessionarioApi#consultaDocumentiUsingGET1");
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

FascicoloConcessionarioApi *apiInstance = [[FascicoloConcessionarioApi alloc] init];

// Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
[apiInstance consultaDocumentiUsingGET1With:idVFU
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

var api = new ApiDocumentation.FascicoloConcessionarioApi()
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaDocumentiUsingGET1(idVFU, callback);
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
    public class consultaDocumentiUsingGET1Example
    {
        public void main()
        {

            var apiInstance = new FascicoloConcessionarioApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
                VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET1(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloConcessionarioApi.consultaDocumentiUsingGET1: " + e.Message );
            }
        }
    }
}
```





```
consultaDocumentiUsingGET1($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloConcessionarioApi->consultaDocumentiUsingGET1: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloConcessionarioApi;

my $api_instance = WWW::SwaggerClient::FascicoloConcessionarioApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->consultaDocumentiUsingGET1(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloConcessionarioApi->consultaDocumentiUsingGET1: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloConcessionarioApi()
idVFU = 789 # Long | idVFU

try:
    # Ritorna la lista delle informazioni dei documenti del veicolo fuori uso
    api_response = api_instance.consulta_documenti_using_get1(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloConcessionarioApi->consultaDocumentiUsingGET1: %s\n" % e)
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
                                  [Schema](#responses-consultaDocumentiUsingGET1-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# downloadDocumentoVfuUsingGET1

                          Permette di scaricare un documento di un veicolo fuori uso













```
/demolitori-aci-ws/rest/concessionario/documentoVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-curl)

                          - [Java](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-java)

                          - [Android](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-android)


                          - [Obj-C](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-objc)

                          - [JavaScript](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-javascript)


                          - [C#](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-csharp)

                          - [PHP](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-php)

                          - [Perl](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-perl)

                          - [Python](#examples-FascicoloConcessionario-downloadDocumentoVfuUsingGET1-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/concessionario/documentoVFU?idAci=&idFascicolo=&progressivoDocumento="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloConcessionarioApi;

import java.io.File;
import java.util.*;

public class FascicoloConcessionarioApiExample {

    public static void main(String[] args) {

        FascicoloConcessionarioApi apiInstance = new FascicoloConcessionarioApi();
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET1(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloConcessionarioApi#downloadDocumentoVfuUsingGET1");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloConcessionarioApi;

public class FascicoloConcessionarioApiExample {

    public static void main(String[] args) {
        FascicoloConcessionarioApi apiInstance = new FascicoloConcessionarioApi();
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET1(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloConcessionarioApi#downloadDocumentoVfuUsingGET1");
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

FascicoloConcessionarioApi *apiInstance = [[FascicoloConcessionarioApi alloc] init];

// Permette di scaricare un documento di un veicolo fuori uso
[apiInstance downloadDocumentoVfuUsingGET1With:idAci
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

var api = new ApiDocumentation.FascicoloConcessionarioApi()
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
api.downloadDocumentoVfuUsingGET1(opts, callback);
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
    public class downloadDocumentoVfuUsingGET1Example
    {
        public void main()
        {

            var apiInstance = new FascicoloConcessionarioApi();
            var idAci = 789;  // Long |  (optional)
            var idFascicolo = 789;  // Long |  (optional)
            var progressivoDocumento = 789;  // Long |  (optional)

            try
            {
                // Permette di scaricare un documento di un veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET1(idAci, idFascicolo, progressivoDocumento);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloConcessionarioApi.downloadDocumentoVfuUsingGET1: " + e.Message );
            }
        }
    }
}
```





```
downloadDocumentoVfuUsingGET1($idAci, $idFascicolo, $progressivoDocumento);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloConcessionarioApi->downloadDocumentoVfuUsingGET1: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloConcessionarioApi;

my $api_instance = WWW::SwaggerClient::FascicoloConcessionarioApi->new();
my $idAci = 789; # Long |
my $idFascicolo = 789; # Long |
my $progressivoDocumento = 789; # Long |

eval {
    my $result = $api_instance->downloadDocumentoVfuUsingGET1(idAci => $idAci, idFascicolo => $idFascicolo, progressivoDocumento => $progressivoDocumento);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloConcessionarioApi->downloadDocumentoVfuUsingGET1: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloConcessionarioApi()
idAci = 789 # Long |  (optional)
idFascicolo = 789 # Long |  (optional)
progressivoDocumento = 789 # Long |  (optional)

try:
    # Permette di scaricare un documento di un veicolo fuori uso
    api_response = api_instance.download_documento_vfu_using_get1(idAci=idAci, idFascicolo=idFascicolo, progressivoDocumento=progressivoDocumento)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloConcessionarioApi->downloadDocumentoVfuUsingGET1: %s\n" % e)
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
                                  [Schema](#responses-downloadDocumentoVfuUsingGET1-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# FascicoloUMC





# consultaDocumentiUsingGET3

                          Ritorna la lista dei documenti di un veicolo fuori uso













```
/demolitori-aci-ws/rest/umc/consulta/documentoVFU/{idVFU}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-curl)

                          - [Java](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-java)

                          - [Android](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-android)


                          - [Obj-C](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-objc)

                          - [JavaScript](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-javascript)


                          - [C#](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-csharp)

                          - [PHP](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-php)

                          - [Perl](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-perl)

                          - [Python](#examples-FascicoloUMC-consultaDocumentiUsingGET3-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/consulta/documentoVFU/{idVFU}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloUMCApi;

import java.io.File;
import java.util.*;

public class FascicoloUMCApiExample {

    public static void main(String[] args) {

        FascicoloUMCApi apiInstance = new FascicoloUMCApi();
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET3(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloUMCApi#consultaDocumentiUsingGET3");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloUMCApi;

public class FascicoloUMCApiExample {

    public static void main(String[] args) {
        FascicoloUMCApi apiInstance = new FascicoloUMCApi();
        Long idVFU = 789; // Long | idVFU
        try {
            VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET3(idVFU);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloUMCApi#consultaDocumentiUsingGET3");
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

FascicoloUMCApi *apiInstance = [[FascicoloUMCApi alloc] init];

// Ritorna la lista dei documenti di un veicolo fuori uso
[apiInstance consultaDocumentiUsingGET3With:idVFU
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

var api = new ApiDocumentation.FascicoloUMCApi()
var idVFU = 789; // {{Long}} idVFU

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaDocumentiUsingGET3(idVFU, callback);
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
    public class consultaDocumentiUsingGET3Example
    {
        public void main()
        {

            var apiInstance = new FascicoloUMCApi();
            var idVFU = 789;  // Long | idVFU

            try
            {
                // Ritorna la lista dei documenti di un veicolo fuori uso
                VfuRestResponseOfListOfDocumentoVFU result = apiInstance.consultaDocumentiUsingGET3(idVFU);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloUMCApi.consultaDocumentiUsingGET3: " + e.Message );
            }
        }
    }
}
```





```
consultaDocumentiUsingGET3($idVFU);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloUMCApi->consultaDocumentiUsingGET3: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloUMCApi;

my $api_instance = WWW::SwaggerClient::FascicoloUMCApi->new();
my $idVFU = 789; # Long | idVFU

eval {
    my $result = $api_instance->consultaDocumentiUsingGET3(idVFU => $idVFU);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloUMCApi->consultaDocumentiUsingGET3: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloUMCApi()
idVFU = 789 # Long | idVFU

try:
    # Ritorna la lista dei documenti di un veicolo fuori uso
    api_response = api_instance.consulta_documenti_using_get3(idVFU)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloUMCApi->consultaDocumentiUsingGET3: %s\n" % e)
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
                                  [Schema](#responses-consultaDocumentiUsingGET3-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# dettaglioFascicoloUsingGET3

                          Ritorna il dettaglio di un fascicolo













```
/demolitori-aci-ws/rest/umc/fascicolo/{idFascicolo}
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-curl)

                          - [Java](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-java)

                          - [Android](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-android)


                          - [Obj-C](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-objc)

                          - [JavaScript](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-javascript)


                          - [C#](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-csharp)

                          - [PHP](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-php)

                          - [Perl](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-perl)

                          - [Python](#examples-FascicoloUMC-dettaglioFascicoloUsingGET3-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/fascicolo/{idFascicolo}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloUMCApi;

import java.io.File;
import java.util.*;

public class FascicoloUMCApiExample {

    public static void main(String[] args) {

        FascicoloUMCApi apiInstance = new FascicoloUMCApi();
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET3(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloUMCApi#dettaglioFascicoloUsingGET3");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloUMCApi;

public class FascicoloUMCApiExample {

    public static void main(String[] args) {
        FascicoloUMCApi apiInstance = new FascicoloUMCApi();
        Long idFascicolo = 789; // Long | idFascicolo
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET3(idFascicolo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloUMCApi#dettaglioFascicoloUsingGET3");
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

FascicoloUMCApi *apiInstance = [[FascicoloUMCApi alloc] init];

// Ritorna il dettaglio di un fascicolo
[apiInstance dettaglioFascicoloUsingGET3With:idFascicolo
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

var api = new ApiDocumentation.FascicoloUMCApi()
var idFascicolo = 789; // {{Long}} idFascicolo

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.dettaglioFascicoloUsingGET3(idFascicolo, callback);
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
    public class dettaglioFascicoloUsingGET3Example
    {
        public void main()
        {

            var apiInstance = new FascicoloUMCApi();
            var idFascicolo = 789;  // Long | idFascicolo

            try
            {
                // Ritorna il dettaglio di un fascicolo
                VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET3(idFascicolo);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloUMCApi.dettaglioFascicoloUsingGET3: " + e.Message );
            }
        }
    }
}
```





```
dettaglioFascicoloUsingGET3($idFascicolo);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloUMCApi->dettaglioFascicoloUsingGET3: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloUMCApi;

my $api_instance = WWW::SwaggerClient::FascicoloUMCApi->new();
my $idFascicolo = 789; # Long | idFascicolo

eval {
    my $result = $api_instance->dettaglioFascicoloUsingGET3(idFascicolo => $idFascicolo);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloUMCApi->dettaglioFascicoloUsingGET3: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloUMCApi()
idFascicolo = 789 # Long | idFascicolo

try:
    # Ritorna il dettaglio di un fascicolo
    api_response = api_instance.dettaglio_fascicolo_using_get3(idFascicolo)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloUMCApi->dettaglioFascicoloUsingGET3: %s\n" % e)
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
                                  [Schema](#responses-dettaglioFascicoloUsingGET3-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# downloadDocumentoVfuUsingGET3

                          Permette di scaricare un documento di un veicolo fuori uso













```
/demolitori-aci-ws/rest/umc/documentoVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-curl)

                          - [Java](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-java)

                          - [Android](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-android)


                          - [Obj-C](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-objc)

                          - [JavaScript](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-javascript)


                          - [C#](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-csharp)

                          - [PHP](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-php)

                          - [Perl](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-perl)

                          - [Python](#examples-FascicoloUMC-downloadDocumentoVfuUsingGET3-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/documentoVFU?idAci=&idFascicolo=&progressivoDocumento="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.FascicoloUMCApi;

import java.io.File;
import java.util.*;

public class FascicoloUMCApiExample {

    public static void main(String[] args) {

        FascicoloUMCApi apiInstance = new FascicoloUMCApi();
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET3(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloUMCApi#downloadDocumentoVfuUsingGET3");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.FascicoloUMCApi;

public class FascicoloUMCApiExample {

    public static void main(String[] args) {
        FascicoloUMCApi apiInstance = new FascicoloUMCApi();
        Long idAci = 789; // Long |
        Long idFascicolo = 789; // Long |
        Long progressivoDocumento = 789; // Long |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET3(idAci, idFascicolo, progressivoDocumento);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling FascicoloUMCApi#downloadDocumentoVfuUsingGET3");
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

FascicoloUMCApi *apiInstance = [[FascicoloUMCApi alloc] init];

// Permette di scaricare un documento di un veicolo fuori uso
[apiInstance downloadDocumentoVfuUsingGET3With:idAci
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

var api = new ApiDocumentation.FascicoloUMCApi()
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
api.downloadDocumentoVfuUsingGET3(opts, callback);
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
    public class downloadDocumentoVfuUsingGET3Example
    {
        public void main()
        {

            var apiInstance = new FascicoloUMCApi();
            var idAci = 789;  // Long |  (optional)
            var idFascicolo = 789;  // Long |  (optional)
            var progressivoDocumento = 789;  // Long |  (optional)

            try
            {
                // Permette di scaricare un documento di un veicolo fuori uso
                VfuRestResponseOfDocumentoVFU result = apiInstance.downloadDocumentoVfuUsingGET3(idAci, idFascicolo, progressivoDocumento);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling FascicoloUMCApi.downloadDocumentoVfuUsingGET3: " + e.Message );
            }
        }
    }
}
```





```
downloadDocumentoVfuUsingGET3($idAci, $idFascicolo, $progressivoDocumento);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling FascicoloUMCApi->downloadDocumentoVfuUsingGET3: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::FascicoloUMCApi;

my $api_instance = WWW::SwaggerClient::FascicoloUMCApi->new();
my $idAci = 789; # Long |
my $idFascicolo = 789; # Long |
my $progressivoDocumento = 789; # Long |

eval {
    my $result = $api_instance->downloadDocumentoVfuUsingGET3(idAci => $idAci, idFascicolo => $idFascicolo, progressivoDocumento => $progressivoDocumento);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling FascicoloUMCApi->downloadDocumentoVfuUsingGET3: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.FascicoloUMCApi()
idAci = 789 # Long |  (optional)
idFascicolo = 789 # Long |  (optional)
progressivoDocumento = 789 # Long |  (optional)

try:
    # Permette di scaricare un documento di un veicolo fuori uso
    api_response = api_instance.download_documento_vfu_using_get3(idAci=idAci, idFascicolo=idFascicolo, progressivoDocumento=progressivoDocumento)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling FascicoloUMCApi->downloadDocumentoVfuUsingGET3: %s\n" % e)
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
                                  [Schema](#responses-downloadDocumentoVfuUsingGET3-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# ImpresaGestioneVFUCR





# consultaCentroRaccoltaUsingGET

                          Ritorna la lista paginata dei CR cui è possibile trasferire un VFU













```
/demolitori-aci-ws/rest/cr/consulta/centroRaccolta
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-java)

                          - [Android](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/consulta/centroRaccolta?codiceProvincia=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUCRApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUCRApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUCRApi apiInstance = new ImpresaGestioneVFUCRApi();
        String codiceProvincia = codiceProvincia_example; // String |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfSedeImpresaVfu result = apiInstance.consultaCentroRaccoltaUsingGET(codiceProvincia, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUCRApi#consultaCentroRaccoltaUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUCRApi;

public class ImpresaGestioneVFUCRApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUCRApi apiInstance = new ImpresaGestioneVFUCRApi();
        String codiceProvincia = codiceProvincia_example; // String |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfSedeImpresaVfu result = apiInstance.consultaCentroRaccoltaUsingGET(codiceProvincia, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUCRApi#consultaCentroRaccoltaUsingGET");
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
String *codiceProvincia = codiceProvincia_example; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
Boolean *unpaged = true; //  (optional)

ImpresaGestioneVFUCRApi *apiInstance = [[ImpresaGestioneVFUCRApi alloc] init];

// Ritorna la lista paginata dei CR cui è possibile trasferire un VFU
[apiInstance consultaCentroRaccoltaUsingGETWith:codiceProvincia
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPageOfSedeImpresaVfu output, NSError* error) {
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

var api = new ApiDocumentation.ImpresaGestioneVFUCRApi()
var opts = {
  'codiceProvincia': codiceProvincia_example, // {{String}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaCentroRaccoltaUsingGET(opts, callback);
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
    public class consultaCentroRaccoltaUsingGETExample
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUCRApi();
            var codiceProvincia = codiceProvincia_example;  // String |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna la lista paginata dei CR cui è possibile trasferire un VFU
                VfuRestResponseOfPageOfSedeImpresaVfu result = apiInstance.consultaCentroRaccoltaUsingGET(codiceProvincia, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUCRApi.consultaCentroRaccoltaUsingGET: " + e.Message );
            }
        }
    }
}
```





```
consultaCentroRaccoltaUsingGET($codiceProvincia, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUCRApi->consultaCentroRaccoltaUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUCRApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUCRApi->new();
my $codiceProvincia = codiceProvincia_example; # String |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->consultaCentroRaccoltaUsingGET(codiceProvincia => $codiceProvincia, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUCRApi->consultaCentroRaccoltaUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUCRApi()
codiceProvincia = codiceProvincia_example # String |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna la lista paginata dei CR cui è possibile trasferire un VFU
    api_response = api_instance.consulta_centro_raccolta_using_get(codiceProvincia=codiceProvincia, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUCRApi->consultaCentroRaccoltaUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceProvincia |







                                                    String





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


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaCentroRaccoltaUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# consultaConcessionarioUsingGET

                          Ritorna la lista paginata dei Concessionari delegabili dal CR













```
/demolitori-aci-ws/rest/cr/consulta/concessionario
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-java)

                          - [Android](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/consulta/concessionario?codiceFiscale=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUCRApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUCRApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUCRApi apiInstance = new ImpresaGestioneVFUCRApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfListOfSedeImpresaVfu result = apiInstance.consultaConcessionarioUsingGET(codiceFiscale, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUCRApi#consultaConcessionarioUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUCRApi;

public class ImpresaGestioneVFUCRApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUCRApi apiInstance = new ImpresaGestioneVFUCRApi();
        String codiceFiscale = codiceFiscale_example; // String |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfListOfSedeImpresaVfu result = apiInstance.consultaConcessionarioUsingGET(codiceFiscale, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUCRApi#consultaConcessionarioUsingGET");
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
String *codiceFiscale = codiceFiscale_example; //
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
Boolean *unpaged = true; //  (optional)

ImpresaGestioneVFUCRApi *apiInstance = [[ImpresaGestioneVFUCRApi alloc] init];

// Ritorna la lista paginata dei Concessionari delegabili dal CR
[apiInstance consultaConcessionarioUsingGETWith:codiceFiscale
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfListOfSedeImpresaVfu output, NSError* error) {
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

var api = new ApiDocumentation.ImpresaGestioneVFUCRApi()
var codiceFiscale = codiceFiscale_example; // {{String}}
var opts = {
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaConcessionarioUsingGET(codiceFiscale, opts, callback);
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
    public class consultaConcessionarioUsingGETExample
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUCRApi();
            var codiceFiscale = codiceFiscale_example;  // String |
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna la lista paginata dei Concessionari delegabili dal CR
                VfuRestResponseOfListOfSedeImpresaVfu result = apiInstance.consultaConcessionarioUsingGET(codiceFiscale, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUCRApi.consultaConcessionarioUsingGET: " + e.Message );
            }
        }
    }
}
```





```
consultaConcessionarioUsingGET($codiceFiscale, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUCRApi->consultaConcessionarioUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUCRApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUCRApi->new();
my $codiceFiscale = codiceFiscale_example; # String |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->consultaConcessionarioUsingGET(codiceFiscale => $codiceFiscale, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUCRApi->consultaConcessionarioUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUCRApi()
codiceFiscale = codiceFiscale_example # String |
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna la lista paginata dei Concessionari delegabili dal CR
    api_response = api_instance.consulta_concessionario_using_get(codiceFiscale, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUCRApi->consultaConcessionarioUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale* |







                                                    String




                                                    Required



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


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaConcessionarioUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# consultaSediTrasferimentoUsingGET

                          Ritorna la lista paginata dei CR cui è possibile trasferire un VFU













```
/demolitori-aci-ws/rest/cr/VFU/{idVFU}/sediTrasferimento
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-java)

                          - [Android](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/VFU/{idVFU}/sediTrasferimento?codiceProvincia=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUCRApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUCRApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUCRApi apiInstance = new ImpresaGestioneVFUCRApi();
        Long idVFU = 789; // Long | idVFU
        String codiceProvincia = codiceProvincia_example; // String |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfSedeImpresaVfu result = apiInstance.consultaSediTrasferimentoUsingGET(idVFU, codiceProvincia, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUCRApi#consultaSediTrasferimentoUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUCRApi;

public class ImpresaGestioneVFUCRApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUCRApi apiInstance = new ImpresaGestioneVFUCRApi();
        Long idVFU = 789; // Long | idVFU
        String codiceProvincia = codiceProvincia_example; // String |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfSedeImpresaVfu result = apiInstance.consultaSediTrasferimentoUsingGET(idVFU, codiceProvincia, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUCRApi#consultaSediTrasferimentoUsingGET");
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
String *codiceProvincia = codiceProvincia_example; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
Boolean *unpaged = true; //  (optional)

ImpresaGestioneVFUCRApi *apiInstance = [[ImpresaGestioneVFUCRApi alloc] init];

// Ritorna la lista paginata dei CR cui è possibile trasferire un VFU
[apiInstance consultaSediTrasferimentoUsingGETWith:idVFU
    codiceProvincia:codiceProvincia
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPageOfSedeImpresaVfu output, NSError* error) {
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

var api = new ApiDocumentation.ImpresaGestioneVFUCRApi()
var idVFU = 789; // {{Long}} idVFU
var opts = {
  'codiceProvincia': codiceProvincia_example, // {{String}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaSediTrasferimentoUsingGET(idVFU, opts, callback);
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
    public class consultaSediTrasferimentoUsingGETExample
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUCRApi();
            var idVFU = 789;  // Long | idVFU
            var codiceProvincia = codiceProvincia_example;  // String |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna la lista paginata dei CR cui è possibile trasferire un VFU
                VfuRestResponseOfPageOfSedeImpresaVfu result = apiInstance.consultaSediTrasferimentoUsingGET(idVFU, codiceProvincia, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUCRApi.consultaSediTrasferimentoUsingGET: " + e.Message );
            }
        }
    }
}
```





```
consultaSediTrasferimentoUsingGET($idVFU, $codiceProvincia, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUCRApi->consultaSediTrasferimentoUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUCRApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUCRApi->new();
my $idVFU = 789; # Long | idVFU
my $codiceProvincia = codiceProvincia_example; # String |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->consultaSediTrasferimentoUsingGET(idVFU => $idVFU, codiceProvincia => $codiceProvincia, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUCRApi->consultaSediTrasferimentoUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUCRApi()
idVFU = 789 # Long | idVFU
codiceProvincia = codiceProvincia_example # String |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna la lista paginata dei CR cui è possibile trasferire un VFU
    api_response = api_instance.consulta_sedi_trasferimento_using_get(idVFU, codiceProvincia=codiceProvincia, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUCRApi->consultaSediTrasferimentoUsingGET: %s\n" % e)
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




                            Query parameters



                                Name |
                                Description |


                                codiceProvincia |







                                                    String





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


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaSediTrasferimentoUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# ImpresaGestioneVFUConcessionario





# findCRConferibiliUsingGET

                          Ritorna la lista dei CR che hanno delegato il concessionario













```
/demolitori-aci-ws/rest/concessionario/centriRaccoltaConferibili
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-java)

                          - [Android](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/concessionario/centriRaccoltaConferibili?codiceFiscale="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUConcessionarioApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUConcessionarioApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUConcessionarioApi apiInstance = new ImpresaGestioneVFUConcessionarioApi();
        String codiceFiscale = codiceFiscale_example; // String |
        try {
            VfuRestResponseOfListOfSedeImpresaVfu result = apiInstance.findCRConferibiliUsingGET(codiceFiscale);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUConcessionarioApi#findCRConferibiliUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUConcessionarioApi;

public class ImpresaGestioneVFUConcessionarioApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUConcessionarioApi apiInstance = new ImpresaGestioneVFUConcessionarioApi();
        String codiceFiscale = codiceFiscale_example; // String |
        try {
            VfuRestResponseOfListOfSedeImpresaVfu result = apiInstance.findCRConferibiliUsingGET(codiceFiscale);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUConcessionarioApi#findCRConferibiliUsingGET");
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

ImpresaGestioneVFUConcessionarioApi *apiInstance = [[ImpresaGestioneVFUConcessionarioApi alloc] init];

// Ritorna la lista dei CR che hanno delegato il concessionario
[apiInstance findCRConferibiliUsingGETWith:codiceFiscale
              completionHandler: ^(VfuRestResponseOfListOfSedeImpresaVfu output, NSError* error) {
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

var api = new ApiDocumentation.ImpresaGestioneVFUConcessionarioApi()
var opts = {
  'codiceFiscale': codiceFiscale_example // {{String}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.findCRConferibiliUsingGET(opts, callback);
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
    public class findCRConferibiliUsingGETExample
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUConcessionarioApi();
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)

            try
            {
                // Ritorna la lista dei CR che hanno delegato il concessionario
                VfuRestResponseOfListOfSedeImpresaVfu result = apiInstance.findCRConferibiliUsingGET(codiceFiscale);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUConcessionarioApi.findCRConferibiliUsingGET: " + e.Message );
            }
        }
    }
}
```





```
findCRConferibiliUsingGET($codiceFiscale);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUConcessionarioApi->findCRConferibiliUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUConcessionarioApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUConcessionarioApi->new();
my $codiceFiscale = codiceFiscale_example; # String |

eval {
    my $result = $api_instance->findCRConferibiliUsingGET(codiceFiscale => $codiceFiscale);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUConcessionarioApi->findCRConferibiliUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUConcessionarioApi()
codiceFiscale = codiceFiscale_example # String |  (optional)

try:
    # Ritorna la lista dei CR che hanno delegato il concessionario
    api_response = api_instance.find_cr_conferibili_using_get(codiceFiscale=codiceFiscale)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUConcessionarioApi->findCRConferibiliUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                codiceFiscale |







                                                    String





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-findCRConferibiliUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# ImpresaGestioneVFUUMC





# consultaImpresaUsingGET

                          Ritorna la lista paginata delle imprese accreditate













```
/demolitori-aci-ws/rest/umc/consulta/impresaGestioneVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-java)

                          - [Android](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUUMC-consultaImpresaUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/consulta/impresaGestioneVFU?almenoUno=&codiceFiscale=&codiceProvincia=&dataInserimentoA=&dataInserimentoDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&tipoImpresaGestioneVFU=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Boolean almenoUno = true; // Boolean |
        String codiceFiscale = codiceFiscale_example; // String |
        String codiceProvincia = codiceProvincia_example; // String |
        Date dataInserimentoA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInserimentoDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfSedeImpresaVfuDtt result = apiInstance.consultaImpresaUsingGET(almenoUno, codiceFiscale, codiceProvincia, dataInserimentoA, dataInserimentoDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, tipoImpresaGestioneVFU, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#consultaImpresaUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Boolean almenoUno = true; // Boolean |
        String codiceFiscale = codiceFiscale_example; // String |
        String codiceProvincia = codiceProvincia_example; // String |
        Date dataInserimentoA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInserimentoDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPageOfSedeImpresaVfuDtt result = apiInstance.consultaImpresaUsingGET(almenoUno, codiceFiscale, codiceProvincia, dataInserimentoA, dataInserimentoDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, tipoImpresaGestioneVFU, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#consultaImpresaUsingGET");
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
Boolean *almenoUno = true; //  (optional)
String *codiceFiscale = codiceFiscale_example; //  (optional)
String *codiceProvincia = codiceProvincia_example; //  (optional)
Date *dataInserimentoA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInserimentoDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; //  (optional)
Boolean *unpaged = true; //  (optional)

ImpresaGestioneVFUUMCApi *apiInstance = [[ImpresaGestioneVFUUMCApi alloc] init];

// Ritorna la lista paginata delle imprese accreditate
[apiInstance consultaImpresaUsingGETWith:almenoUno
    codiceFiscale:codiceFiscale
    codiceProvincia:codiceProvincia
    dataInserimentoA:dataInserimentoA
    dataInserimentoDa:dataInserimentoDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    tipoImpresaGestioneVFU:tipoImpresaGestioneVFU
    unpaged:unpaged
              completionHandler: ^(VfuRestResponseOfPageOfSedeImpresaVfuDtt output, NSError* error) {
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

var api = new ApiDocumentation.ImpresaGestioneVFUUMCApi()
var opts = {
  'almenoUno': true, // {{Boolean}}
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'codiceProvincia': codiceProvincia_example, // {{String}}
  'dataInserimentoA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInserimentoDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'tipoImpresaGestioneVFU': tipoImpresaGestioneVFU_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.consultaImpresaUsingGET(opts, callback);
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
    public class consultaImpresaUsingGETExample
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUUMCApi();
            var almenoUno = true;  // Boolean |  (optional)
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var codiceProvincia = codiceProvincia_example;  // String |  (optional)
            var dataInserimentoA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInserimentoDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna la lista paginata delle imprese accreditate
                VfuRestResponseOfPageOfSedeImpresaVfuDtt result = apiInstance.consultaImpresaUsingGET(almenoUno, codiceFiscale, codiceProvincia, dataInserimentoA, dataInserimentoDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, tipoImpresaGestioneVFU, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUUMCApi.consultaImpresaUsingGET: " + e.Message );
            }
        }
    }
}
```





```
consultaImpresaUsingGET($almenoUno, $codiceFiscale, $codiceProvincia, $dataInserimentoA, $dataInserimentoDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $tipoImpresaGestioneVFU, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUUMCApi->consultaImpresaUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUUMCApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUUMCApi->new();
my $almenoUno = true; # Boolean |
my $codiceFiscale = codiceFiscale_example; # String |
my $codiceProvincia = codiceProvincia_example; # String |
my $dataInserimentoA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInserimentoDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->consultaImpresaUsingGET(almenoUno => $almenoUno, codiceFiscale => $codiceFiscale, codiceProvincia => $codiceProvincia, dataInserimentoA => $dataInserimentoA, dataInserimentoDa => $dataInserimentoDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, tipoImpresaGestioneVFU => $tipoImpresaGestioneVFU, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUUMCApi->consultaImpresaUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUUMCApi()
almenoUno = true # Boolean |  (optional)
codiceFiscale = codiceFiscale_example # String |  (optional)
codiceProvincia = codiceProvincia_example # String |  (optional)
dataInserimentoA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInserimentoDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna la lista paginata delle imprese accreditate
    api_response = api_instance.consulta_impresa_using_get(almenoUno=almenoUno, codiceFiscale=codiceFiscale, codiceProvincia=codiceProvincia, dataInserimentoA=dataInserimentoA, dataInserimentoDa=dataInserimentoDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, tipoImpresaGestioneVFU=tipoImpresaGestioneVFU, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUUMCApi->consultaImpresaUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                almenoUno |







                                                    Boolean





                                 |


                                codiceFiscale |







                                                    String





                                 |


                                codiceProvincia |







                                                    String





                                 |


                                dataInserimentoA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInserimentoDa |







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


                                tipoImpresaGestioneVFU |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-consultaImpresaUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# findOneUsingGET9

                          Ritorna il dettaglio dell'impresa accreditata













```
/demolitori-aci-ws/rest/umc/impresaGestioneVFU/{idImpresa}
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-java)

                          - [Android](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUUMC-findOneUsingGET9-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/impresaGestioneVFU/{idImpresa}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Long idImpresa = 789; // Long | idImpresa
        try {
            VfuRestResponseOfSedeImpresaVfuDtt result = apiInstance.findOneUsingGET9(idImpresa);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#findOneUsingGET9");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Long idImpresa = 789; // Long | idImpresa
        try {
            VfuRestResponseOfSedeImpresaVfuDtt result = apiInstance.findOneUsingGET9(idImpresa);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#findOneUsingGET9");
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
Long *idImpresa = 789; // idImpresa

ImpresaGestioneVFUUMCApi *apiInstance = [[ImpresaGestioneVFUUMCApi alloc] init];

// Ritorna il dettaglio dell'impresa accreditata
[apiInstance findOneUsingGET9With:idImpresa
              completionHandler: ^(VfuRestResponseOfSedeImpresaVfuDtt output, NSError* error) {
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

var api = new ApiDocumentation.ImpresaGestioneVFUUMCApi()
var idImpresa = 789; // {{Long}} idImpresa

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.findOneUsingGET9(idImpresa, callback);
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
    public class findOneUsingGET9Example
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUUMCApi();
            var idImpresa = 789;  // Long | idImpresa

            try
            {
                // Ritorna il dettaglio dell'impresa accreditata
                VfuRestResponseOfSedeImpresaVfuDtt result = apiInstance.findOneUsingGET9(idImpresa);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUUMCApi.findOneUsingGET9: " + e.Message );
            }
        }
    }
}
```





```
findOneUsingGET9($idImpresa);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUUMCApi->findOneUsingGET9: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUUMCApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUUMCApi->new();
my $idImpresa = 789; # Long | idImpresa

eval {
    my $result = $api_instance->findOneUsingGET9(idImpresa => $idImpresa);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUUMCApi->findOneUsingGET9: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUUMCApi()
idImpresa = 789 # Long | idImpresa

try:
    # Ritorna il dettaglio dell'impresa accreditata
    api_response = api_instance.find_one_using_get9(idImpresa)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUUMCApi->findOneUsingGET9: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idImpresa* |







                                                      Long


                                                          (int64)



                                                          idImpresa



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-findOneUsingGET9-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# stampaImpresaUsingGET

                          Ritorna il pdf della lista paginata delle imprese accreditate













```
/demolitori-aci-ws/rest/umc/stampa/impresaGestioneVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-java)

                          - [Android](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUUMC-stampaImpresaUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/stampa/impresaGestioneVFU?almenoUno=&codiceFiscale=&codiceProvincia=&dataInserimentoA=&dataInserimentoDa=&offset=&pageNumber=&pageSize=&paged=&sort.sorted=&sort.unsorted=&tipoImpresaGestioneVFU=&unpaged="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Boolean almenoUno = true; // Boolean |
        String codiceFiscale = codiceFiscale_example; // String |
        String codiceProvincia = codiceProvincia_example; // String |
        Date dataInserimentoA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInserimentoDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaImpresaUsingGET(almenoUno, codiceFiscale, codiceProvincia, dataInserimentoA, dataInserimentoDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, tipoImpresaGestioneVFU, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#stampaImpresaUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Boolean almenoUno = true; // Boolean |
        String codiceFiscale = codiceFiscale_example; // String |
        String codiceProvincia = codiceProvincia_example; // String |
        Date dataInserimentoA = 2013-10-20T19:20:30+01:00; // Date |
        Date dataInserimentoDa = 2013-10-20T19:20:30+01:00; // Date |
        Long offset = 789; // Long |
        Integer pageNumber = 56; // Integer |
        Integer pageSize = 56; // Integer |
        Boolean paged = true; // Boolean |
        Boolean sort.sorted = true; // Boolean |
        Boolean sort.unsorted = true; // Boolean |
        String tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; // String |
        Boolean unpaged = true; // Boolean |
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaImpresaUsingGET(almenoUno, codiceFiscale, codiceProvincia, dataInserimentoA, dataInserimentoDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, tipoImpresaGestioneVFU, unpaged);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#stampaImpresaUsingGET");
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
Boolean *almenoUno = true; //  (optional)
String *codiceFiscale = codiceFiscale_example; //  (optional)
String *codiceProvincia = codiceProvincia_example; //  (optional)
Date *dataInserimentoA = 2013-10-20T19:20:30+01:00; //  (optional)
Date *dataInserimentoDa = 2013-10-20T19:20:30+01:00; //  (optional)
Long *offset = 789; //  (optional)
Integer *pageNumber = 56; //  (optional)
Integer *pageSize = 56; //  (optional)
Boolean *paged = true; //  (optional)
Boolean *sort.sorted = true; //  (optional)
Boolean *sort.unsorted = true; //  (optional)
String *tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; //  (optional)
Boolean *unpaged = true; //  (optional)

ImpresaGestioneVFUUMCApi *apiInstance = [[ImpresaGestioneVFUUMCApi alloc] init];

// Ritorna il pdf della lista paginata delle imprese accreditate
[apiInstance stampaImpresaUsingGETWith:almenoUno
    codiceFiscale:codiceFiscale
    codiceProvincia:codiceProvincia
    dataInserimentoA:dataInserimentoA
    dataInserimentoDa:dataInserimentoDa
    offset:offset
    pageNumber:pageNumber
    pageSize:pageSize
    paged:paged
    sort.sorted:sort.sorted
    sort.unsorted:sort.unsorted
    tipoImpresaGestioneVFU:tipoImpresaGestioneVFU
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

var api = new ApiDocumentation.ImpresaGestioneVFUUMCApi()
var opts = {
  'almenoUno': true, // {{Boolean}}
  'codiceFiscale': codiceFiscale_example, // {{String}}
  'codiceProvincia': codiceProvincia_example, // {{String}}
  'dataInserimentoA': 2013-10-20T19:20:30+01:00, // {{Date}}
  'dataInserimentoDa': 2013-10-20T19:20:30+01:00, // {{Date}}
  'offset': 789, // {{Long}}
  'pageNumber': 56, // {{Integer}}
  'pageSize': 56, // {{Integer}}
  'paged': true, // {{Boolean}}
  'sort.sorted': true, // {{Boolean}}
  'sort.unsorted': true, // {{Boolean}}
  'tipoImpresaGestioneVFU': tipoImpresaGestioneVFU_example, // {{String}}
  'unpaged': true // {{Boolean}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.stampaImpresaUsingGET(opts, callback);
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
    public class stampaImpresaUsingGETExample
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUUMCApi();
            var almenoUno = true;  // Boolean |  (optional)
            var codiceFiscale = codiceFiscale_example;  // String |  (optional)
            var codiceProvincia = codiceProvincia_example;  // String |  (optional)
            var dataInserimentoA = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var dataInserimentoDa = 2013-10-20T19:20:30+01:00;  // Date |  (optional)
            var offset = 789;  // Long |  (optional)
            var pageNumber = 56;  // Integer |  (optional)
            var pageSize = 56;  // Integer |  (optional)
            var paged = true;  // Boolean |  (optional)
            var sort.sorted = true;  // Boolean |  (optional)
            var sort.unsorted = true;  // Boolean |  (optional)
            var tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example;  // String |  (optional)
            var unpaged = true;  // Boolean |  (optional)

            try
            {
                // Ritorna il pdf della lista paginata delle imprese accreditate
                VfuRestResponseOfPdfBean result = apiInstance.stampaImpresaUsingGET(almenoUno, codiceFiscale, codiceProvincia, dataInserimentoA, dataInserimentoDa, offset, pageNumber, pageSize, paged, sort.sorted, sort.unsorted, tipoImpresaGestioneVFU, unpaged);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUUMCApi.stampaImpresaUsingGET: " + e.Message );
            }
        }
    }
}
```





```
stampaImpresaUsingGET($almenoUno, $codiceFiscale, $codiceProvincia, $dataInserimentoA, $dataInserimentoDa, $offset, $pageNumber, $pageSize, $paged, $sort.sorted, $sort.unsorted, $tipoImpresaGestioneVFU, $unpaged);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUUMCApi->stampaImpresaUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUUMCApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUUMCApi->new();
my $almenoUno = true; # Boolean |
my $codiceFiscale = codiceFiscale_example; # String |
my $codiceProvincia = codiceProvincia_example; # String |
my $dataInserimentoA = 2013-10-20T19:20:30+01:00; # Date |
my $dataInserimentoDa = 2013-10-20T19:20:30+01:00; # Date |
my $offset = 789; # Long |
my $pageNumber = 56; # Integer |
my $pageSize = 56; # Integer |
my $paged = true; # Boolean |
my $sort.sorted = true; # Boolean |
my $sort.unsorted = true; # Boolean |
my $tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example; # String |
my $unpaged = true; # Boolean |

eval {
    my $result = $api_instance->stampaImpresaUsingGET(almenoUno => $almenoUno, codiceFiscale => $codiceFiscale, codiceProvincia => $codiceProvincia, dataInserimentoA => $dataInserimentoA, dataInserimentoDa => $dataInserimentoDa, offset => $offset, pageNumber => $pageNumber, pageSize => $pageSize, paged => $paged, sort.sorted => $sort.sorted, sort.unsorted => $sort.unsorted, tipoImpresaGestioneVFU => $tipoImpresaGestioneVFU, unpaged => $unpaged);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUUMCApi->stampaImpresaUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUUMCApi()
almenoUno = true # Boolean |  (optional)
codiceFiscale = codiceFiscale_example # String |  (optional)
codiceProvincia = codiceProvincia_example # String |  (optional)
dataInserimentoA = 2013-10-20T19:20:30+01:00 # Date |  (optional)
dataInserimentoDa = 2013-10-20T19:20:30+01:00 # Date |  (optional)
offset = 789 # Long |  (optional)
pageNumber = 56 # Integer |  (optional)
pageSize = 56 # Integer |  (optional)
paged = true # Boolean |  (optional)
sort.sorted = true # Boolean |  (optional)
sort.unsorted = true # Boolean |  (optional)
tipoImpresaGestioneVFU = tipoImpresaGestioneVFU_example # String |  (optional)
unpaged = true # Boolean |  (optional)

try:
    # Ritorna il pdf della lista paginata delle imprese accreditate
    api_response = api_instance.stampa_impresa_using_get(almenoUno=almenoUno, codiceFiscale=codiceFiscale, codiceProvincia=codiceProvincia, dataInserimentoA=dataInserimentoA, dataInserimentoDa=dataInserimentoDa, offset=offset, pageNumber=pageNumber, pageSize=pageSize, paged=paged, sort.sorted=sort.sorted, sort.unsorted=sort.unsorted, tipoImpresaGestioneVFU=tipoImpresaGestioneVFU, unpaged=unpaged)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUUMCApi->stampaImpresaUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                almenoUno |







                                                    Boolean





                                 |


                                codiceFiscale |







                                                    String





                                 |


                                codiceProvincia |







                                                    String





                                 |


                                dataInserimentoA |







                                                    Date


                                                        (date-time)





                                 |


                                dataInserimentoDa |







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


                                tipoImpresaGestioneVFU |







                                                    String





                                 |


                                unpaged |







                                                    Boolean





                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-stampaImpresaUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# stampaOneImpresaUsingGET

                          Ritorna il pdf del dettaglio dell'impresa accreditata













```
/demolitori-aci-ws/rest/umc/stampa/impresaGestioneVFU/{idImpresa}
```



### Usage and SDK Samples





                          - [Curl](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-curl)

                          - [Java](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-java)

                          - [Android](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-android)


                          - [Obj-C](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-objc)

                          - [JavaScript](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-javascript)


                          - [C#](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-csharp)

                          - [PHP](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-php)

                          - [Perl](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-perl)

                          - [Python](#examples-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/umc/stampa/impresaGestioneVFU/{idImpresa}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

import java.io.File;
import java.util.*;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {

        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Long idImpresa = 789; // Long | idImpresa
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaOneImpresaUsingGET(idImpresa);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#stampaOneImpresaUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.ImpresaGestioneVFUUMCApi;

public class ImpresaGestioneVFUUMCApiExample {

    public static void main(String[] args) {
        ImpresaGestioneVFUUMCApi apiInstance = new ImpresaGestioneVFUUMCApi();
        Long idImpresa = 789; // Long | idImpresa
        try {
            VfuRestResponseOfPdfBean result = apiInstance.stampaOneImpresaUsingGET(idImpresa);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling ImpresaGestioneVFUUMCApi#stampaOneImpresaUsingGET");
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
Long *idImpresa = 789; // idImpresa

ImpresaGestioneVFUUMCApi *apiInstance = [[ImpresaGestioneVFUUMCApi alloc] init];

// Ritorna il pdf del dettaglio dell'impresa accreditata
[apiInstance stampaOneImpresaUsingGETWith:idImpresa
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

var api = new ApiDocumentation.ImpresaGestioneVFUUMCApi()
var idImpresa = 789; // {{Long}} idImpresa

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.stampaOneImpresaUsingGET(idImpresa, callback);
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
    public class stampaOneImpresaUsingGETExample
    {
        public void main()
        {

            var apiInstance = new ImpresaGestioneVFUUMCApi();
            var idImpresa = 789;  // Long | idImpresa

            try
            {
                // Ritorna il pdf del dettaglio dell'impresa accreditata
                VfuRestResponseOfPdfBean result = apiInstance.stampaOneImpresaUsingGET(idImpresa);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling ImpresaGestioneVFUUMCApi.stampaOneImpresaUsingGET: " + e.Message );
            }
        }
    }
}
```





```
stampaOneImpresaUsingGET($idImpresa);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling ImpresaGestioneVFUUMCApi->stampaOneImpresaUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::ImpresaGestioneVFUUMCApi;

my $api_instance = WWW::SwaggerClient::ImpresaGestioneVFUUMCApi->new();
my $idImpresa = 789; # Long | idImpresa

eval {
    my $result = $api_instance->stampaOneImpresaUsingGET(idImpresa => $idImpresa);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling ImpresaGestioneVFUUMCApi->stampaOneImpresaUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.ImpresaGestioneVFUUMCApi()
idImpresa = 789 # Long | idImpresa

try:
    # Ritorna il pdf del dettaglio dell'impresa accreditata
    api_response = api_instance.stampa_one_impresa_using_get(idImpresa)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling ImpresaGestioneVFUUMCApi->stampaOneImpresaUsingGET: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  idImpresa* |







                                                      Long


                                                          (int64)



                                                          idImpresa



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-stampaOneImpresaUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# InternalRadiazione





# allegaRicevutaRadiazioneVFUUsingPOST

                          Conferma la radiazione di un VFU PRA allegando la relativa ricevuta e cambiando lo stato in 'Radiato'













```
/demolitori-aci-ws/internal/rest/VFU/allega/ricevutaRadiazioneVFU
```



### Usage and SDK Samples





                          - [Curl](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-curl)

                          - [Java](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-java)

                          - [Android](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-android)


                          - [Obj-C](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-objc)

                          - [JavaScript](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-javascript)


                          - [C#](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-csharp)

                          - [PHP](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-php)

                          - [Perl](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-perl)

                          - [Python](#examples-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST-0-python)






```
curl -X POST\
-H "Accept: */*"\
-H "Content-Type: application/json"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/internal/rest/VFU/allega/ricevutaRadiazioneVFU"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.InternalRadiazioneApi;

import java.io.File;
import java.util.*;

public class InternalRadiazioneApiExample {

    public static void main(String[] args) {

        InternalRadiazioneApi apiInstance = new InternalRadiazioneApi();
        VFUConfermaRadiazionePra body = ; // VFUConfermaRadiazionePra |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.allegaRicevutaRadiazioneVFUUsingPOST(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling InternalRadiazioneApi#allegaRicevutaRadiazioneVFUUsingPOST");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.InternalRadiazioneApi;

public class InternalRadiazioneApiExample {

    public static void main(String[] args) {
        InternalRadiazioneApi apiInstance = new InternalRadiazioneApi();
        VFUConfermaRadiazionePra body = ; // VFUConfermaRadiazionePra |
        try {
            VfuRestResponseOfDocumentoVFU result = apiInstance.allegaRicevutaRadiazioneVFUUsingPOST(body);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling InternalRadiazioneApi#allegaRicevutaRadiazioneVFUUsingPOST");
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
VFUConfermaRadiazionePra *body = ; //  (optional)

InternalRadiazioneApi *apiInstance = [[InternalRadiazioneApi alloc] init];

// Conferma la radiazione di un VFU PRA allegando la relativa ricevuta e cambiando lo stato in 'Radiato'
[apiInstance allegaRicevutaRadiazioneVFUUsingPOSTWith:body
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

var api = new ApiDocumentation.InternalRadiazioneApi()
var opts = {
  'body':  // {{VFUConfermaRadiazionePra}}
};
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.allegaRicevutaRadiazioneVFUUsingPOST(opts, callback);
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
    public class allegaRicevutaRadiazioneVFUUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new InternalRadiazioneApi();
            var body = new VFUConfermaRadiazionePra(); // VFUConfermaRadiazionePra |  (optional)

            try
            {
                // Conferma la radiazione di un VFU PRA allegando la relativa ricevuta e cambiando lo stato in 'Radiato'
                VfuRestResponseOfDocumentoVFU result = apiInstance.allegaRicevutaRadiazioneVFUUsingPOST(body);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling InternalRadiazioneApi.allegaRicevutaRadiazioneVFUUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
allegaRicevutaRadiazioneVFUUsingPOST($body);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling InternalRadiazioneApi->allegaRicevutaRadiazioneVFUUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::InternalRadiazioneApi;

my $api_instance = WWW::SwaggerClient::InternalRadiazioneApi->new();
my $body = WWW::SwaggerClient::Object::VFUConfermaRadiazionePra->new(); # VFUConfermaRadiazionePra |

eval {
    my $result = $api_instance->allegaRicevutaRadiazioneVFUUsingPOST(body => $body);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling InternalRadiazioneApi->allegaRicevutaRadiazioneVFUUsingPOST: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.InternalRadiazioneApi()
body =  # VFUConfermaRadiazionePra |  (optional)

try:
    # Conferma la radiazione di un VFU PRA allegando la relativa ricevuta e cambiando lo stato in 'Radiato'
    api_response = api_instance.allega_ricevuta_radiazione_vfu_using_post(body=body)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling InternalRadiazioneApi->allegaRicevutaRadiazioneVFUUsingPOST: %s\n" % e)
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
                                  [Schema](#responses-allegaRicevutaRadiazioneVFUUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# dettaglioFascicoloUsingGET2

                          Ritorna il dettaglio di un fascicolo richiamato da DU













```
/demolitori-aci-ws/internal/rest/VFU/dettaglioFascicolo
```



### Usage and SDK Samples





                          - [Curl](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-curl)

                          - [Java](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-java)

                          - [Android](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-android)


                          - [Obj-C](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-objc)

                          - [JavaScript](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-javascript)


                          - [C#](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-csharp)

                          - [PHP](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-php)

                          - [Perl](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-perl)

                          - [Python](#examples-InternalRadiazione-dettaglioFascicoloUsingGET2-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/internal/rest/VFU/dettaglioFascicolo?obbligoIscrizionePRA=&targa=&tipo="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.InternalRadiazioneApi;

import java.io.File;
import java.util.*;

public class InternalRadiazioneApiExample {

    public static void main(String[] args) {

        InternalRadiazioneApi apiInstance = new InternalRadiazioneApi();
        String obbligoIscrizionePRA = obbligoIscrizionePRA_example; // String |
        String targa = targa_example; // String |
        String tipo = tipo_example; // String |
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET2(obbligoIscrizionePRA, targa, tipo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling InternalRadiazioneApi#dettaglioFascicoloUsingGET2");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.InternalRadiazioneApi;

public class InternalRadiazioneApiExample {

    public static void main(String[] args) {
        InternalRadiazioneApi apiInstance = new InternalRadiazioneApi();
        String obbligoIscrizionePRA = obbligoIscrizionePRA_example; // String |
        String targa = targa_example; // String |
        String tipo = tipo_example; // String |
        try {
            VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET2(obbligoIscrizionePRA, targa, tipo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling InternalRadiazioneApi#dettaglioFascicoloUsingGET2");
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
String *obbligoIscrizionePRA = obbligoIscrizionePRA_example; //
String *targa = targa_example; //
String *tipo = tipo_example; //

InternalRadiazioneApi *apiInstance = [[InternalRadiazioneApi alloc] init];

// Ritorna il dettaglio di un fascicolo richiamato da DU
[apiInstance dettaglioFascicoloUsingGET2With:obbligoIscrizionePRA
    targa:targa
    tipo:tipo
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

var api = new ApiDocumentation.InternalRadiazioneApi()
var obbligoIscrizionePRA = obbligoIscrizionePRA_example; // {{String}}
var targa = targa_example; // {{String}}
var tipo = tipo_example; // {{String}}

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.dettaglioFascicoloUsingGET2(obbligoIscrizionePRA, targa, tipo, callback);
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
    public class dettaglioFascicoloUsingGET2Example
    {
        public void main()
        {

            var apiInstance = new InternalRadiazioneApi();
            var obbligoIscrizionePRA = obbligoIscrizionePRA_example;  // String |
            var targa = targa_example;  // String |
            var tipo = tipo_example;  // String |

            try
            {
                // Ritorna il dettaglio di un fascicolo richiamato da DU
                VfuRestResponseOfFascicoloVFU result = apiInstance.dettaglioFascicoloUsingGET2(obbligoIscrizionePRA, targa, tipo);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling InternalRadiazioneApi.dettaglioFascicoloUsingGET2: " + e.Message );
            }
        }
    }
}
```





```
dettaglioFascicoloUsingGET2($obbligoIscrizionePRA, $targa, $tipo);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling InternalRadiazioneApi->dettaglioFascicoloUsingGET2: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::InternalRadiazioneApi;

my $api_instance = WWW::SwaggerClient::InternalRadiazioneApi->new();
my $obbligoIscrizionePRA = obbligoIscrizionePRA_example; # String |
my $targa = targa_example; # String |
my $tipo = tipo_example; # String |

eval {
    my $result = $api_instance->dettaglioFascicoloUsingGET2(obbligoIscrizionePRA => $obbligoIscrizionePRA, targa => $targa, tipo => $tipo);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling InternalRadiazioneApi->dettaglioFascicoloUsingGET2: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.InternalRadiazioneApi()
obbligoIscrizionePRA = obbligoIscrizionePRA_example # String |
targa = targa_example # String |
tipo = tipo_example # String |

try:
    # Ritorna il dettaglio di un fascicolo richiamato da DU
    api_response = api_instance.dettaglio_fascicolo_using_get2(obbligoIscrizionePRA, targa, tipo)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling InternalRadiazioneApi->dettaglioFascicoloUsingGET2: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                obbligoIscrizionePRA* |







                                                    String




                                                    Required



                                 |


                                targa* |







                                                    String




                                                    Required



                                 |


                                tipo* |







                                                    String




                                                    Required



                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-dettaglioFascicoloUsingGET2-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# dettaglioUsingGET

                          Ritorna dettaglio del veicolo fuori uso richiamato da DU













```
/demolitori-aci-ws/internal/rest/VFU/dettaglio
```



### Usage and SDK Samples





                          - [Curl](#examples-InternalRadiazione-dettaglioUsingGET-0-curl)

                          - [Java](#examples-InternalRadiazione-dettaglioUsingGET-0-java)

                          - [Android](#examples-InternalRadiazione-dettaglioUsingGET-0-android)


                          - [Obj-C](#examples-InternalRadiazione-dettaglioUsingGET-0-objc)

                          - [JavaScript](#examples-InternalRadiazione-dettaglioUsingGET-0-javascript)


                          - [C#](#examples-InternalRadiazione-dettaglioUsingGET-0-csharp)

                          - [PHP](#examples-InternalRadiazione-dettaglioUsingGET-0-php)

                          - [Perl](#examples-InternalRadiazione-dettaglioUsingGET-0-perl)

                          - [Python](#examples-InternalRadiazione-dettaglioUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/internal/rest/VFU/dettaglio?obbligoIscrizionePRA=&targa=&tipo="
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.InternalRadiazioneApi;

import java.io.File;
import java.util.*;

public class InternalRadiazioneApiExample {

    public static void main(String[] args) {

        InternalRadiazioneApi apiInstance = new InternalRadiazioneApi();
        String obbligoIscrizionePRA = obbligoIscrizionePRA_example; // String |
        String targa = targa_example; // String |
        String tipo = tipo_example; // String |
        try {
            VfuRestResponseOfVFUBean result = apiInstance.dettaglioUsingGET(obbligoIscrizionePRA, targa, tipo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling InternalRadiazioneApi#dettaglioUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.InternalRadiazioneApi;

public class InternalRadiazioneApiExample {

    public static void main(String[] args) {
        InternalRadiazioneApi apiInstance = new InternalRadiazioneApi();
        String obbligoIscrizionePRA = obbligoIscrizionePRA_example; // String |
        String targa = targa_example; // String |
        String tipo = tipo_example; // String |
        try {
            VfuRestResponseOfVFUBean result = apiInstance.dettaglioUsingGET(obbligoIscrizionePRA, targa, tipo);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling InternalRadiazioneApi#dettaglioUsingGET");
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
String *obbligoIscrizionePRA = obbligoIscrizionePRA_example; //
String *targa = targa_example; //
String *tipo = tipo_example; //

InternalRadiazioneApi *apiInstance = [[InternalRadiazioneApi alloc] init];

// Ritorna dettaglio del veicolo fuori uso richiamato da DU
[apiInstance dettaglioUsingGETWith:obbligoIscrizionePRA
    targa:targa
    tipo:tipo
              completionHandler: ^(VfuRestResponseOfVFUBean output, NSError* error) {
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

var api = new ApiDocumentation.InternalRadiazioneApi()
var obbligoIscrizionePRA = obbligoIscrizionePRA_example; // {{String}}
var targa = targa_example; // {{String}}
var tipo = tipo_example; // {{String}}

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.dettaglioUsingGET(obbligoIscrizionePRA, targa, tipo, callback);
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
    public class dettaglioUsingGETExample
    {
        public void main()
        {

            var apiInstance = new InternalRadiazioneApi();
            var obbligoIscrizionePRA = obbligoIscrizionePRA_example;  // String |
            var targa = targa_example;  // String |
            var tipo = tipo_example;  // String |

            try
            {
                // Ritorna dettaglio del veicolo fuori uso richiamato da DU
                VfuRestResponseOfVFUBean result = apiInstance.dettaglioUsingGET(obbligoIscrizionePRA, targa, tipo);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling InternalRadiazioneApi.dettaglioUsingGET: " + e.Message );
            }
        }
    }
}
```





```
dettaglioUsingGET($obbligoIscrizionePRA, $targa, $tipo);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling InternalRadiazioneApi->dettaglioUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::InternalRadiazioneApi;

my $api_instance = WWW::SwaggerClient::InternalRadiazioneApi->new();
my $obbligoIscrizionePRA = obbligoIscrizionePRA_example; # String |
my $targa = targa_example; # String |
my $tipo = tipo_example; # String |

eval {
    my $result = $api_instance->dettaglioUsingGET(obbligoIscrizionePRA => $obbligoIscrizionePRA, targa => $targa, tipo => $tipo);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling InternalRadiazioneApi->dettaglioUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.InternalRadiazioneApi()
obbligoIscrizionePRA = obbligoIscrizionePRA_example # String |
targa = targa_example # String |
tipo = tipo_example # String |

try:
    # Ritorna dettaglio del veicolo fuori uso richiamato da DU
    api_response = api_instance.dettaglio_using_get(obbligoIscrizionePRA, targa, tipo)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling InternalRadiazioneApi->dettaglioUsingGET: %s\n" % e)
```





## Parameters

                            Query parameters



                                Name |
                                Description |


                                obbligoIscrizionePRA* |







                                                    String




                                                    Required



                                 |


                                targa* |







                                                    String




                                                    Required



                                 |


                                tipo* |







                                                    String




                                                    Required



                                 |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-dettaglioUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# MonitoraggioController





# getDescrizioneUsingGET

                          getDescrizione













```
/demolitori-aci-ws/mon/status/up
```



### Usage and SDK Samples





                          - [Curl](#examples-MonitoraggioController-getDescrizioneUsingGET-0-curl)

                          - [Java](#examples-MonitoraggioController-getDescrizioneUsingGET-0-java)

                          - [Android](#examples-MonitoraggioController-getDescrizioneUsingGET-0-android)


                          - [Obj-C](#examples-MonitoraggioController-getDescrizioneUsingGET-0-objc)

                          - [JavaScript](#examples-MonitoraggioController-getDescrizioneUsingGET-0-javascript)


                          - [C#](#examples-MonitoraggioController-getDescrizioneUsingGET-0-csharp)

                          - [PHP](#examples-MonitoraggioController-getDescrizioneUsingGET-0-php)

                          - [Perl](#examples-MonitoraggioController-getDescrizioneUsingGET-0-perl)

                          - [Python](#examples-MonitoraggioController-getDescrizioneUsingGET-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/mon/status/up"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.MonitoraggioControllerApi;

import java.io.File;
import java.util.*;

public class MonitoraggioControllerApiExample {

    public static void main(String[] args) {

        MonitoraggioControllerApi apiInstance = new MonitoraggioControllerApi();
        try {
            'Boolean' result = apiInstance.getDescrizioneUsingGET();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling MonitoraggioControllerApi#getDescrizioneUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.MonitoraggioControllerApi;

public class MonitoraggioControllerApiExample {

    public static void main(String[] args) {
        MonitoraggioControllerApi apiInstance = new MonitoraggioControllerApi();
        try {
            'Boolean' result = apiInstance.getDescrizioneUsingGET();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling MonitoraggioControllerApi#getDescrizioneUsingGET");
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
MonitoraggioControllerApi *apiInstance = [[MonitoraggioControllerApi alloc] init];

// getDescrizione
[apiInstance getDescrizioneUsingGETWithCompletionHandler:
              ^('Boolean' output, NSError* error) {
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

var api = new ApiDocumentation.MonitoraggioControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.getDescrizioneUsingGET(callback);
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
    public class getDescrizioneUsingGETExample
    {
        public void main()
        {

            var apiInstance = new MonitoraggioControllerApi();

            try
            {
                // getDescrizione
                'Boolean' result = apiInstance.getDescrizioneUsingGET();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling MonitoraggioControllerApi.getDescrizioneUsingGET: " + e.Message );
            }
        }
    }
}
```





```
getDescrizioneUsingGET();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling MonitoraggioControllerApi->getDescrizioneUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::MonitoraggioControllerApi;

my $api_instance = WWW::SwaggerClient::MonitoraggioControllerApi->new();

eval {
    my $result = $api_instance->getDescrizioneUsingGET();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling MonitoraggioControllerApi->getDescrizioneUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.MonitoraggioControllerApi()

try:
    # getDescrizione
    api_response = api_instance.get_descrizione_using_get()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling MonitoraggioControllerApi->getDescrizioneUsingGET: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-getDescrizioneUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














#
