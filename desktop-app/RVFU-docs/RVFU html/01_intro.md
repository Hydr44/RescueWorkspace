# RVFU – API Documentation (estratto in Markdown)

> Conversione da HTML a Markdown (script locale, no pandoc)

API Docs 2


            -->
            - [API Summary](#api-_)

                  - [API Methods - AgenziaCR](#api-AgenziaCR)

                    -
                      [findAgenziaSedeOperativaUsingGET](#api-AgenziaCR-findAgenziaSedeOperativaUsingGET)


                    -
                      [findOneUsingGET4](#api-AgenziaCR-findOneUsingGET4)


                  - [API Methods - BasicErrorController](#api-BasicErrorController)

                    -
                      [errorHtmlUsingDELETE](#api-BasicErrorController-errorHtmlUsingDELETE)


                    -
                      [errorHtmlUsingGET](#api-BasicErrorController-errorHtmlUsingGET)


                    -
                      [errorHtmlUsingHEAD](#api-BasicErrorController-errorHtmlUsingHEAD)


                    -
                      [errorHtmlUsingOPTIONS](#api-BasicErrorController-errorHtmlUsingOPTIONS)


                    -
                      [errorHtmlUsingPATCH](#api-BasicErrorController-errorHtmlUsingPATCH)


                    -
                      [errorHtmlUsingPOST](#api-BasicErrorController-errorHtmlUsingPOST)


                    -
                      [errorHtmlUsingPUT](#api-BasicErrorController-errorHtmlUsingPUT)


                  - [API Methods - DelegaCR](#api-DelegaCR)

                    -
                      [aggiornaDelegaUsingPUT](#api-DelegaCR-aggiornaDelegaUsingPUT)


                    -
                      [consultaDelegheUsingGET1](#api-DelegaCR-consultaDelegheUsingGET1)


                    -
                      [eliminaDelegaUsingDELETE](#api-DelegaCR-eliminaDelegaUsingDELETE)


                    -
                      [findOneUsingGET5](#api-DelegaCR-findOneUsingGET5)


                    -
                      [inserisciDelegaUsingPOST](#api-DelegaCR-inserisciDelegaUsingPOST)


                    -
                      [revocaDelegaUsingPUT](#api-DelegaCR-revocaDelegaUsingPUT)


                    -
                      [stampaDelegheUsingGET1](#api-DelegaCR-stampaDelegheUsingGET1)


                  - [API Methods - DelegaConcessionario](#api-DelegaConcessionario)

                    -
                      [consultaDelegheUsingGET](#api-DelegaConcessionario-consultaDelegheUsingGET)


                    -
                      [findOneUsingGET1](#api-DelegaConcessionario-findOneUsingGET1)


                    -
                      [stampaDelegheUsingGET](#api-DelegaConcessionario-stampaDelegheUsingGET)


                  - [API Methods - DelegaUMC](#api-DelegaUMC)

                    -
                      [consultaDelegheUsingGET2](#api-DelegaUMC-consultaDelegheUsingGET2)


                    -
                      [findOneUsingGET8](#api-DelegaUMC-findOneUsingGET8)


                    -
                      [stampaDelegheUsingGET2](#api-DelegaUMC-stampaDelegheUsingGET2)


                  - [API Methods - FascicoloAgenzia](#api-FascicoloAgenzia)

                    -
                      [consultaDocumentiUsingGET](#api-FascicoloAgenzia-consultaDocumentiUsingGET)


                    -
                      [dettaglioFascicoloUsingGET](#api-FascicoloAgenzia-dettaglioFascicoloUsingGET)


                    -
                      [downloadDocumentoVfuUsingGET](#api-FascicoloAgenzia-downloadDocumentoVfuUsingGET)


                  - [API Methods - FascicoloCR](#api-FascicoloCR)

                    -
                      [aggiornaDocumentoVFUUsingPUT](#api-FascicoloCR-aggiornaDocumentoVFUUsingPUT)


                    -
                      [allegaDocumentoUsingPOST](#api-FascicoloCR-allegaDocumentoUsingPOST)


                    -
                      [annullaAndClonaCartellaFirmaVFUUsingDELETE](#api-FascicoloCR-annullaAndClonaCartellaFirmaVFUUsingDELETE)


                    -
                      [chiudiFascicoloUsingPUT](#api-FascicoloCR-chiudiFascicoloUsingPUT)


                    -
                      [consultaDocumentiUsingGET2](#api-FascicoloCR-consultaDocumentiUsingGET2)


                    -
                      [dettaglioFascicoloUsingGET1](#api-FascicoloCR-dettaglioFascicoloUsingGET1)


                    -
                      [downloadDocumentoVfuUsingGET2](#api-FascicoloCR-downloadDocumentoVfuUsingGET2)


                    -
                      [eliminaDocumentoVFUUsingPOST](#api-FascicoloCR-eliminaDocumentoVFUUsingPOST)


                    -
                      [generaCertificatoRottamazioneUsingPOST](#api-FascicoloCR-generaCertificatoRottamazioneUsingPOST)


                    -
                      [generaPostillaCdrUsingPOST](#api-FascicoloCR-generaPostillaCdrUsingPOST)


                    -
                      [generaRicevutaPresaInCaricoUsingPOST](#api-FascicoloCR-generaRicevutaPresaInCaricoUsingPOST)


                    -
                      [inviaAlTabletUsingPUT](#api-FascicoloCR-inviaAlTabletUsingPUT)


                    -
                      [riapriFascicoloUsingPUT](#api-FascicoloCR-riapriFascicoloUsingPUT)


                    -
                      [verificaFascicoloUsingGET](#api-FascicoloCR-verificaFascicoloUsingGET)


                  - [API Methods - FascicoloConcessionario](#api-FascicoloConcessionario)

                    -
                      [consultaDocumentiUsingGET1](#api-FascicoloConcessionario-consultaDocumentiUsingGET1)


                    -
                      [downloadDocumentoVfuUsingGET1](#api-FascicoloConcessionario-downloadDocumentoVfuUsingGET1)


                  - [API Methods - FascicoloUMC](#api-FascicoloUMC)

                    -
                      [consultaDocumentiUsingGET3](#api-FascicoloUMC-consultaDocumentiUsingGET3)


                    -
                      [dettaglioFascicoloUsingGET3](#api-FascicoloUMC-dettaglioFascicoloUsingGET3)


                    -
                      [downloadDocumentoVfuUsingGET3](#api-FascicoloUMC-downloadDocumentoVfuUsingGET3)


                  - [API Methods - ImpresaGestioneVFUCR](#api-ImpresaGestioneVFUCR)

                    -
                      [consultaCentroRaccoltaUsingGET](#api-ImpresaGestioneVFUCR-consultaCentroRaccoltaUsingGET)


                    -
                      [consultaConcessionarioUsingGET](#api-ImpresaGestioneVFUCR-consultaConcessionarioUsingGET)


                    -
                      [consultaSediTrasferimentoUsingGET](#api-ImpresaGestioneVFUCR-consultaSediTrasferimentoUsingGET)


                  - [API Methods - ImpresaGestioneVFUConcessionario](#api-ImpresaGestioneVFUConcessionario)

                    -
                      [findCRConferibiliUsingGET](#api-ImpresaGestioneVFUConcessionario-findCRConferibiliUsingGET)


                  - [API Methods - ImpresaGestioneVFUUMC](#api-ImpresaGestioneVFUUMC)

                    -
                      [consultaImpresaUsingGET](#api-ImpresaGestioneVFUUMC-consultaImpresaUsingGET)


                    -
                      [findOneUsingGET9](#api-ImpresaGestioneVFUUMC-findOneUsingGET9)


                    -
                      [stampaImpresaUsingGET](#api-ImpresaGestioneVFUUMC-stampaImpresaUsingGET)


                    -
                      [stampaOneImpresaUsingGET](#api-ImpresaGestioneVFUUMC-stampaOneImpresaUsingGET)


                  - [API Methods - InternalRadiazione](#api-InternalRadiazione)

                    -
                      [allegaRicevutaRadiazioneVFUUsingPOST](#api-InternalRadiazione-allegaRicevutaRadiazioneVFUUsingPOST)


                    -
                      [dettaglioFascicoloUsingGET2](#api-InternalRadiazione-dettaglioFascicoloUsingGET2)


                    -
                      [dettaglioUsingGET](#api-InternalRadiazione-dettaglioUsingGET)


                  - [API Methods - MonitoraggioController](#api-MonitoraggioController)

                    -
                      [getDescrizioneUsingGET](#api-MonitoraggioController-getDescrizioneUsingGET)


                  - [API Methods -
