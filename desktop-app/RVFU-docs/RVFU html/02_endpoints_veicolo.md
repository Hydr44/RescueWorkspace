# 02 Endpoints Veicolo

veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/agenziaSTA/sedeOperativa/{codiceAgenzia}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.AgenziaCRApi;

import java.io.File;
import java.util.*;

public class AgenziaCRApiExample {

    public static void main(String[] args) {

        AgenziaCRApi apiInstance = new AgenziaCRApi();
        String codiceAgenzia = codiceAgenzia_example; // String | codiceAgenzia
        try {
            VfuRestResponseOfAgenziaStaDTT result = apiInstance.findAgenziaSedeOperativaUsingGET(codiceAgenzia);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling AgenziaCRApi#findAgenziaSedeOperativaUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.AgenziaCRApi;

public class AgenziaCRApiExample {

    public static void main(String[] args) {
        AgenziaCRApi apiInstance = new AgenziaCRApi();
        String codiceAgenzia = codiceAgenzia_example; // String | codiceAgenzia
        try {
            VfuRestResponseOfAgenziaStaDTT result = apiInstance.findAgenziaSedeOperativaUsingGET(codiceAgenzia);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling AgenziaCRApi#findAgenziaSedeOperativaUsingGET");
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
String *codiceAgenzia = codiceAgenzia_example; // codiceAgenzia

AgenziaCRApi *apiInstance = [[AgenziaCRApi alloc] init];

// Ritorna il dettaglio di un'agenzia STA per sede operativa
[apiInstance findAgenziaSedeOperativaUsingGETWith:codiceAgenzia
              completionHandler: ^(VfuRestResponseOfAgenziaStaDTT output, NSError* error) {
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

var api = new ApiDocumentation.AgenziaCRApi()
var codiceAgenzia = codiceAgenzia_example; // {{String}} codiceAgenzia

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.findAgenziaSedeOperativaUsingGET(codiceAgenzia, callback);
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
    public class findAgenziaSedeOperativaUsingGETExample
    {
        public void main()
        {

            var apiInstance = new AgenziaCRApi();
            var codiceAgenzia = codiceAgenzia_example;  // String | codiceAgenzia

            try
            {
                // Ritorna il dettaglio di un'agenzia STA per sede operativa
                VfuRestResponseOfAgenziaStaDTT result = apiInstance.findAgenziaSedeOperativaUsingGET(codiceAgenzia);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling AgenziaCRApi.findAgenziaSedeOperativaUsingGET: " + e.Message );
            }
        }
    }
}
```





```
findAgenziaSedeOperativaUsingGET($codiceAgenzia);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AgenziaCRApi->findAgenziaSedeOperativaUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::AgenziaCRApi;

my $api_instance = WWW::SwaggerClient::AgenziaCRApi->new();
my $codiceAgenzia = codiceAgenzia_example; # String | codiceAgenzia

eval {
    my $result = $api_instance->findAgenziaSedeOperativaUsingGET(codiceAgenzia => $codiceAgenzia);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling AgenziaCRApi->findAgenziaSedeOperativaUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.AgenziaCRApi()
codiceAgenzia = codiceAgenzia_example # String | codiceAgenzia

try:
    # Ritorna il dettaglio di un'agenzia STA per sede operativa
    api_response = api_instance.find_agenzia_sede_operativa_using_get(codiceAgenzia)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling AgenziaCRApi->findAgenziaSedeOperativaUsingGET: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  codiceAgenzia* |







                                                      String



                                                          codiceAgenzia



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-findAgenziaSedeOperativaUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# findOneUsingGET4

                          Ritorna il dettaglio di un'agenzia STA













```
/demolitori-aci-ws/rest/cr/agenziaSTA/{codiceAgenzia}
```



### Usage and SDK Samples





                          - [Curl](#examples-AgenziaCR-findOneUsingGET4-0-curl)

                          - [Java](#examples-AgenziaCR-findOneUsingGET4-0-java)

                          - [Android](#examples-AgenziaCR-findOneUsingGET4-0-android)


                          - [Obj-C](#examples-AgenziaCR-findOneUsingGET4-0-objc)

                          - [JavaScript](#examples-AgenziaCR-findOneUsingGET4-0-javascript)


                          - [C#](#examples-AgenziaCR-findOneUsingGET4-0-csharp)

                          - [PHP](#examples-AgenziaCR-findOneUsingGET4-0-php)

                          - [Perl](#examples-AgenziaCR-findOneUsingGET4-0-perl)

                          - [Python](#examples-AgenziaCR-findOneUsingGET4-0-python)






```
curl -X GET\
-H "Accept: */*"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/rest/cr/agenziaSTA/{codiceAgenzia}"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.AgenziaCRApi;

import java.io.File;
import java.util.*;

public class AgenziaCRApiExample {

    public static void main(String[] args) {

        AgenziaCRApi apiInstance = new AgenziaCRApi();
        String codiceAgenzia = codiceAgenzia_example; // String | codiceAgenzia
        try {
            VfuRestResponseOfAgenziaStaDTT result = apiInstance.findOneUsingGET4(codiceAgenzia);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling AgenziaCRApi#findOneUsingGET4");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.AgenziaCRApi;

public class AgenziaCRApiExample {

    public static void main(String[] args) {
        AgenziaCRApi apiInstance = new AgenziaCRApi();
        String codiceAgenzia = codiceAgenzia_example; // String | codiceAgenzia
        try {
            VfuRestResponseOfAgenziaStaDTT result = apiInstance.findOneUsingGET4(codiceAgenzia);
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling AgenziaCRApi#findOneUsingGET4");
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
String *codiceAgenzia = codiceAgenzia_example; // codiceAgenzia

AgenziaCRApi *apiInstance = [[AgenziaCRApi alloc] init];

// Ritorna il dettaglio di un'agenzia STA
[apiInstance findOneUsingGET4With:codiceAgenzia
              completionHandler: ^(VfuRestResponseOfAgenziaStaDTT output, NSError* error) {
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

var api = new ApiDocumentation.AgenziaCRApi()
var codiceAgenzia = codiceAgenzia_example; // {{String}} codiceAgenzia

var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.findOneUsingGET4(codiceAgenzia, callback);
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
    public class findOneUsingGET4Example
    {
        public void main()
        {

            var apiInstance = new AgenziaCRApi();
            var codiceAgenzia = codiceAgenzia_example;  // String | codiceAgenzia

            try
            {
                // Ritorna il dettaglio di un'agenzia STA
                VfuRestResponseOfAgenziaStaDTT result = apiInstance.findOneUsingGET4(codiceAgenzia);
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling AgenziaCRApi.findOneUsingGET4: " + e.Message );
            }
        }
    }
}
```





```
findOneUsingGET4($codiceAgenzia);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling AgenziaCRApi->findOneUsingGET4: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::AgenziaCRApi;

my $api_instance = WWW::SwaggerClient::AgenziaCRApi->new();
my $codiceAgenzia = codiceAgenzia_example; # String | codiceAgenzia

eval {
    my $result = $api_instance->findOneUsingGET4(codiceAgenzia => $codiceAgenzia);
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling AgenziaCRApi->findOneUsingGET4: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.AgenziaCRApi()
codiceAgenzia = codiceAgenzia_example # String | codiceAgenzia

try:
    # Ritorna il dettaglio di un'agenzia STA
    api_response = api_instance.find_one_using_get4(codiceAgenzia)
    pprint(api_response)
except ApiException as e:
    print("Exception when calling AgenziaCRApi->findOneUsingGET4: %s\n" % e)
```





## Parameters

                            Path parameters



                                  Name |
                                  Description |


                                  codiceAgenzia* |







                                                      String



                                                          codiceAgenzia



                                                      Required



                                   |





## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-findOneUsingGET4-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# BasicErrorController





# errorHtmlUsingDELETE

                          errorHtml













```
/demolitori-aci-ws/error
```



### Usage and SDK Samples





                          - [Curl](#examples-BasicErrorController-errorHtmlUsingDELETE-0-curl)

                          - [Java](#examples-BasicErrorController-errorHtmlUsingDELETE-0-java)

                          - [Android](#examples-BasicErrorController-errorHtmlUsingDELETE-0-android)


                          - [Obj-C](#examples-BasicErrorController-errorHtmlUsingDELETE-0-objc)

                          - [JavaScript](#examples-BasicErrorController-errorHtmlUsingDELETE-0-javascript)


                          - [C#](#examples-BasicErrorController-errorHtmlUsingDELETE-0-csharp)

                          - [PHP](#examples-BasicErrorController-errorHtmlUsingDELETE-0-php)

                          - [Perl](#examples-BasicErrorController-errorHtmlUsingDELETE-0-perl)

                          - [Python](#examples-BasicErrorController-errorHtmlUsingDELETE-0-python)






```
curl -X DELETE\
-H "Accept: text/html"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/error"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.BasicErrorControllerApi;

import java.io.File;
import java.util.*;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {

        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingDELETE();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingDELETE");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.BasicErrorControllerApi;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {
        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingDELETE();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingDELETE");
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
BasicErrorControllerApi *apiInstance = [[BasicErrorControllerApi alloc] init];

// errorHtml
[apiInstance errorHtmlUsingDELETEWithCompletionHandler:
              ^(ModelAndView output, NSError* error) {
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

var api = new ApiDocumentation.BasicErrorControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.errorHtmlUsingDELETE(callback);
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
    public class errorHtmlUsingDELETEExample
    {
        public void main()
        {

            var apiInstance = new BasicErrorControllerApi();

            try
            {
                // errorHtml
                ModelAndView result = apiInstance.errorHtmlUsingDELETE();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling BasicErrorControllerApi.errorHtmlUsingDELETE: " + e.Message );
            }
        }
    }
}
```





```
errorHtmlUsingDELETE();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling BasicErrorControllerApi->errorHtmlUsingDELETE: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::BasicErrorControllerApi;

my $api_instance = WWW::SwaggerClient::BasicErrorControllerApi->new();

eval {
    my $result = $api_instance->errorHtmlUsingDELETE();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling BasicErrorControllerApi->errorHtmlUsingDELETE: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.BasicErrorControllerApi()

try:
    # errorHtml
    api_response = api_instance.error_html_using_delete()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling BasicErrorControllerApi->errorHtmlUsingDELETE: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-errorHtmlUsingDELETE-200-schema)














###  Status: 204 - No Content









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden















# errorHtmlUsingGET

                          errorHtml













```
/demolitori-aci-ws/error
```



### Usage and SDK Samples





                          - [Curl](#examples-BasicErrorController-errorHtmlUsingGET-0-curl)

                          - [Java](#examples-BasicErrorController-errorHtmlUsingGET-0-java)

                          - [Android](#examples-BasicErrorController-errorHtmlUsingGET-0-android)


                          - [Obj-C](#examples-BasicErrorController-errorHtmlUsingGET-0-objc)

                          - [JavaScript](#examples-BasicErrorController-errorHtmlUsingGET-0-javascript)


                          - [C#](#examples-BasicErrorController-errorHtmlUsingGET-0-csharp)

                          - [PHP](#examples-BasicErrorController-errorHtmlUsingGET-0-php)

                          - [Perl](#examples-BasicErrorController-errorHtmlUsingGET-0-perl)

                          - [Python](#examples-BasicErrorController-errorHtmlUsingGET-0-python)






```
curl -X GET\
-H "Accept: text/html"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/error"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.BasicErrorControllerApi;

import java.io.File;
import java.util.*;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {

        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingGET();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingGET");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.BasicErrorControllerApi;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {
        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingGET();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingGET");
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
BasicErrorControllerApi *apiInstance = [[BasicErrorControllerApi alloc] init];

// errorHtml
[apiInstance errorHtmlUsingGETWithCompletionHandler:
              ^(ModelAndView output, NSError* error) {
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

var api = new ApiDocumentation.BasicErrorControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.errorHtmlUsingGET(callback);
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
    public class errorHtmlUsingGETExample
    {
        public void main()
        {

            var apiInstance = new BasicErrorControllerApi();

            try
            {
                // errorHtml
                ModelAndView result = apiInstance.errorHtmlUsingGET();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling BasicErrorControllerApi.errorHtmlUsingGET: " + e.Message );
            }
        }
    }
}
```





```
errorHtmlUsingGET();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling BasicErrorControllerApi->errorHtmlUsingGET: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::BasicErrorControllerApi;

my $api_instance = WWW::SwaggerClient::BasicErrorControllerApi->new();

eval {
    my $result = $api_instance->errorHtmlUsingGET();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling BasicErrorControllerApi->errorHtmlUsingGET: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.BasicErrorControllerApi()

try:
    # errorHtml
    api_response = api_instance.error_html_using_get()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling BasicErrorControllerApi->errorHtmlUsingGET: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-errorHtmlUsingGET-200-schema)














###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# errorHtmlUsingHEAD

                          errorHtml













```
/demolitori-aci-ws/error
```



### Usage and SDK Samples





                          - [Curl](#examples-BasicErrorController-errorHtmlUsingHEAD-0-curl)

                          - [Java](#examples-BasicErrorController-errorHtmlUsingHEAD-0-java)

                          - [Android](#examples-BasicErrorController-errorHtmlUsingHEAD-0-android)


                          - [Obj-C](#examples-BasicErrorController-errorHtmlUsingHEAD-0-objc)

                          - [JavaScript](#examples-BasicErrorController-errorHtmlUsingHEAD-0-javascript)


                          - [C#](#examples-BasicErrorController-errorHtmlUsingHEAD-0-csharp)

                          - [PHP](#examples-BasicErrorController-errorHtmlUsingHEAD-0-php)

                          - [Perl](#examples-BasicErrorController-errorHtmlUsingHEAD-0-perl)

                          - [Python](#examples-BasicErrorController-errorHtmlUsingHEAD-0-python)






```
curl -X HEAD\
-H "Accept: text/html"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/error"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.BasicErrorControllerApi;

import java.io.File;
import java.util.*;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {

        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingHEAD();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingHEAD");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.BasicErrorControllerApi;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {
        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingHEAD();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingHEAD");
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
BasicErrorControllerApi *apiInstance = [[BasicErrorControllerApi alloc] init];

// errorHtml
[apiInstance errorHtmlUsingHEADWithCompletionHandler:
              ^(ModelAndView output, NSError* error) {
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

var api = new ApiDocumentation.BasicErrorControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.errorHtmlUsingHEAD(callback);
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
    public class errorHtmlUsingHEADExample
    {
        public void main()
        {

            var apiInstance = new BasicErrorControllerApi();

            try
            {
                // errorHtml
                ModelAndView result = apiInstance.errorHtmlUsingHEAD();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling BasicErrorControllerApi.errorHtmlUsingHEAD: " + e.Message );
            }
        }
    }
}
```





```
errorHtmlUsingHEAD();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling BasicErrorControllerApi->errorHtmlUsingHEAD: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::BasicErrorControllerApi;

my $api_instance = WWW::SwaggerClient::BasicErrorControllerApi->new();

eval {
    my $result = $api_instance->errorHtmlUsingHEAD();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling BasicErrorControllerApi->errorHtmlUsingHEAD: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.BasicErrorControllerApi()

try:
    # errorHtml
    api_response = api_instance.error_html_using_head()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling BasicErrorControllerApi->errorHtmlUsingHEAD: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-errorHtmlUsingHEAD-200-schema)














###  Status: 204 - No Content









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden















# errorHtmlUsingOPTIONS

                          errorHtml













```
/demolitori-aci-ws/error
```



### Usage and SDK Samples





                          - [Curl](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-curl)

                          - [Java](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-java)

                          - [Android](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-android)


                          - [Obj-C](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-objc)

                          - [JavaScript](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-javascript)


                          - [C#](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-csharp)

                          - [PHP](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-php)

                          - [Perl](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-perl)

                          - [Python](#examples-BasicErrorController-errorHtmlUsingOPTIONS-0-python)






```
curl -X OPTIONS\
-H "Accept: text/html"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/error"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.BasicErrorControllerApi;

import java.io.File;
import java.util.*;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {

        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingOPTIONS();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingOPTIONS");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.BasicErrorControllerApi;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {
        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingOPTIONS();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingOPTIONS");
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
BasicErrorControllerApi *apiInstance = [[BasicErrorControllerApi alloc] init];

// errorHtml
[apiInstance errorHtmlUsingOPTIONSWithCompletionHandler:
              ^(ModelAndView output, NSError* error) {
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

var api = new ApiDocumentation.BasicErrorControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.errorHtmlUsingOPTIONS(callback);
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
    public class errorHtmlUsingOPTIONSExample
    {
        public void main()
        {

            var apiInstance = new BasicErrorControllerApi();

            try
            {
                // errorHtml
                ModelAndView result = apiInstance.errorHtmlUsingOPTIONS();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling BasicErrorControllerApi.errorHtmlUsingOPTIONS: " + e.Message );
            }
        }
    }
}
```





```
errorHtmlUsingOPTIONS();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling BasicErrorControllerApi->errorHtmlUsingOPTIONS: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::BasicErrorControllerApi;

my $api_instance = WWW::SwaggerClient::BasicErrorControllerApi->new();

eval {
    my $result = $api_instance->errorHtmlUsingOPTIONS();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling BasicErrorControllerApi->errorHtmlUsingOPTIONS: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.BasicErrorControllerApi()

try:
    # errorHtml
    api_response = api_instance.error_html_using_options()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling BasicErrorControllerApi->errorHtmlUsingOPTIONS: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-errorHtmlUsingOPTIONS-200-schema)














###  Status: 204 - No Content









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden















# errorHtmlUsingPATCH

                          errorHtml













```
/demolitori-aci-ws/error
```



### Usage and SDK Samples





                          - [Curl](#examples-BasicErrorController-errorHtmlUsingPATCH-0-curl)

                          - [Java](#examples-BasicErrorController-errorHtmlUsingPATCH-0-java)

                          - [Android](#examples-BasicErrorController-errorHtmlUsingPATCH-0-android)


                          - [Obj-C](#examples-BasicErrorController-errorHtmlUsingPATCH-0-objc)

                          - [JavaScript](#examples-BasicErrorController-errorHtmlUsingPATCH-0-javascript)


                          - [C#](#examples-BasicErrorController-errorHtmlUsingPATCH-0-csharp)

                          - [PHP](#examples-BasicErrorController-errorHtmlUsingPATCH-0-php)

                          - [Perl](#examples-BasicErrorController-errorHtmlUsingPATCH-0-perl)

                          - [Python](#examples-BasicErrorController-errorHtmlUsingPATCH-0-python)






```
curl -X PATCH\
-H "Accept: text/html"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/error"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.BasicErrorControllerApi;

import java.io.File;
import java.util.*;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {

        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingPATCH();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingPATCH");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.BasicErrorControllerApi;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {
        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingPATCH();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingPATCH");
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
BasicErrorControllerApi *apiInstance = [[BasicErrorControllerApi alloc] init];

// errorHtml
[apiInstance errorHtmlUsingPATCHWithCompletionHandler:
              ^(ModelAndView output, NSError* error) {
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

var api = new ApiDocumentation.BasicErrorControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.errorHtmlUsingPATCH(callback);
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
    public class errorHtmlUsingPATCHExample
    {
        public void main()
        {

            var apiInstance = new BasicErrorControllerApi();

            try
            {
                // errorHtml
                ModelAndView result = apiInstance.errorHtmlUsingPATCH();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling BasicErrorControllerApi.errorHtmlUsingPATCH: " + e.Message );
            }
        }
    }
}
```





```
errorHtmlUsingPATCH();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling BasicErrorControllerApi->errorHtmlUsingPATCH: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::BasicErrorControllerApi;

my $api_instance = WWW::SwaggerClient::BasicErrorControllerApi->new();

eval {
    my $result = $api_instance->errorHtmlUsingPATCH();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling BasicErrorControllerApi->errorHtmlUsingPATCH: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.BasicErrorControllerApi()

try:
    # errorHtml
    api_response = api_instance.error_html_using_patch()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling BasicErrorControllerApi->errorHtmlUsingPATCH: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-errorHtmlUsingPATCH-200-schema)














###  Status: 204 - No Content









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden















# errorHtmlUsingPOST

                          errorHtml













```
/demolitori-aci-ws/error
```



### Usage and SDK Samples





                          - [Curl](#examples-BasicErrorController-errorHtmlUsingPOST-0-curl)

                          - [Java](#examples-BasicErrorController-errorHtmlUsingPOST-0-java)

                          - [Android](#examples-BasicErrorController-errorHtmlUsingPOST-0-android)


                          - [Obj-C](#examples-BasicErrorController-errorHtmlUsingPOST-0-objc)

                          - [JavaScript](#examples-BasicErrorController-errorHtmlUsingPOST-0-javascript)


                          - [C#](#examples-BasicErrorController-errorHtmlUsingPOST-0-csharp)

                          - [PHP](#examples-BasicErrorController-errorHtmlUsingPOST-0-php)

                          - [Perl](#examples-BasicErrorController-errorHtmlUsingPOST-0-perl)

                          - [Python](#examples-BasicErrorController-errorHtmlUsingPOST-0-python)






```
curl -X POST\
-H "Accept: text/html"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/error"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.BasicErrorControllerApi;

import java.io.File;
import java.util.*;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {

        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingPOST();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingPOST");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.BasicErrorControllerApi;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {
        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingPOST();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingPOST");
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
BasicErrorControllerApi *apiInstance = [[BasicErrorControllerApi alloc] init];

// errorHtml
[apiInstance errorHtmlUsingPOSTWithCompletionHandler:
              ^(ModelAndView output, NSError* error) {
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

var api = new ApiDocumentation.BasicErrorControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.errorHtmlUsingPOST(callback);
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
    public class errorHtmlUsingPOSTExample
    {
        public void main()
        {

            var apiInstance = new BasicErrorControllerApi();

            try
            {
                // errorHtml
                ModelAndView result = apiInstance.errorHtmlUsingPOST();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling BasicErrorControllerApi.errorHtmlUsingPOST: " + e.Message );
            }
        }
    }
}
```





```
errorHtmlUsingPOST();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling BasicErrorControllerApi->errorHtmlUsingPOST: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::BasicErrorControllerApi;

my $api_instance = WWW::SwaggerClient::BasicErrorControllerApi->new();

eval {
    my $result = $api_instance->errorHtmlUsingPOST();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling BasicErrorControllerApi->errorHtmlUsingPOST: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.BasicErrorControllerApi()

try:
    # errorHtml
    api_response = api_instance.error_html_using_post()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling BasicErrorControllerApi->errorHtmlUsingPOST: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-errorHtmlUsingPOST-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found















# errorHtmlUsingPUT

                          errorHtml













```
/demolitori-aci-ws/error
```



### Usage and SDK Samples





                          - [Curl](#examples-BasicErrorController-errorHtmlUsingPUT-0-curl)

                          - [Java](#examples-BasicErrorController-errorHtmlUsingPUT-0-java)

                          - [Android](#examples-BasicErrorController-errorHtmlUsingPUT-0-android)


                          - [Obj-C](#examples-BasicErrorController-errorHtmlUsingPUT-0-objc)

                          - [JavaScript](#examples-BasicErrorController-errorHtmlUsingPUT-0-javascript)


                          - [C#](#examples-BasicErrorController-errorHtmlUsingPUT-0-csharp)

                          - [PHP](#examples-BasicErrorController-errorHtmlUsingPUT-0-php)

                          - [Perl](#examples-BasicErrorController-errorHtmlUsingPUT-0-perl)

                          - [Python](#examples-BasicErrorController-errorHtmlUsingPUT-0-python)






```
curl -X PUT\
-H "Accept: text/html"\
"http://gestione-veicolo-fuoriuso-tst.serviziaci.it:80/demolitori-aci-ws/error"
```




```
import io.swagger.client.*;
import io.swagger.client.auth.*;
import io.swagger.client.model.*;
import io.swagger.client.api.BasicErrorControllerApi;

import java.io.File;
import java.util.*;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {

        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingPUT();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingPUT");
            e.printStackTrace();
        }
    }
}
```





```
import io.swagger.client.api.BasicErrorControllerApi;

public class BasicErrorControllerApiExample {

    public static void main(String[] args) {
        BasicErrorControllerApi apiInstance = new BasicErrorControllerApi();
        try {
            ModelAndView result = apiInstance.errorHtmlUsingPUT();
            System.out.println(result);
        } catch (ApiException e) {
            System.err.println("Exception when calling BasicErrorControllerApi#errorHtmlUsingPUT");
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
BasicErrorControllerApi *apiInstance = [[BasicErrorControllerApi alloc] init];

// errorHtml
[apiInstance errorHtmlUsingPUTWithCompletionHandler:
              ^(ModelAndView output, NSError* error) {
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

var api = new ApiDocumentation.BasicErrorControllerApi()
var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.errorHtmlUsingPUT(callback);
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
    public class errorHtmlUsingPUTExample
    {
        public void main()
        {

            var apiInstance = new BasicErrorControllerApi();

            try
            {
                // errorHtml
                ModelAndView result = apiInstance.errorHtmlUsingPUT();
                Debug.WriteLine(result);
            }
            catch (Exception e)
            {
                Debug.Print("Exception when calling BasicErrorControllerApi.errorHtmlUsingPUT: " + e.Message );
            }
        }
    }
}
```





```
errorHtmlUsingPUT();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling BasicErrorControllerApi->errorHtmlUsingPUT: ', $e->getMessage(), PHP_EOL;
}
?>
```





```
use Data::Dumper;
use WWW::SwaggerClient::Configuration;
use WWW::SwaggerClient::BasicErrorControllerApi;

my $api_instance = WWW::SwaggerClient::BasicErrorControllerApi->new();

eval {
    my $result = $api_instance->errorHtmlUsingPUT();
    print Dumper($result);
};
if ($@) {
    warn "Exception when calling BasicErrorControllerApi->errorHtmlUsingPUT: $@\n";
}
```





```
from __future__ import print_statement
import time
import swagger_client
from swagger_client.rest import ApiException
from pprint import pprint

# create an instance of the API class
api_instance = swagger_client.BasicErrorControllerApi()

try:
    # errorHtml
    api_response = api_instance.error_html_using_put()
    pprint(api_response)
except ApiException as e:
    print("Exception when calling BasicErrorControllerApi->errorHtmlUsingPUT: %s\n" % e)
```





## Parameters


## Responses


###  Status: 200 - OK



                                -
                                  [Schema](#responses-errorHtmlUsingPUT-200-schema)














###  Status: 201 - Created









###  Status: 401 - Unauthorized









###  Status: 403 - Forbidden









###  Status: 404 - Not Found














# DelegaCR





# aggiornaDelegaUsingPUT

                          Permette l'aggiornamento di una
