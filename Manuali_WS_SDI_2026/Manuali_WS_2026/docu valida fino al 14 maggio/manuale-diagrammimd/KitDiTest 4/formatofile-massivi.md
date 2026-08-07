Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 1 di 22
SPECIFICHE TECNICHE
FORMATO DEI FILE UTILIZZATI DAI
SERVIZI MASSIVI DI TRASMISSIONE E SCARICO FILE
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 2 di 22
VERSIONE 1.5
STATO DEL DOCUMENTO .......................................................................................................................... 3
1. SERVIZI DI SCARICO MASSIVO .......................................................................................................... 5
1.1. RICHIESTA MASSIVA .......................................................................................................................... 5
1.2. FILE DI ESITO DELLA RICHIESTA DI SCARICO MASSIVO ....................................................................... 15
1.3. FILE PRESENTI NEGLI ARCHIVI CREATI............................................................................................... 17
1.3.1. DATI MASSIVI CORRISPETTIVI ...................................................................................................... 17
1.3.2. FILE MASSIVI FATTURE ................................................................................................................ 17
1.3.3. DATI MASSIVI BOLLO ELENCHI A-B ............................................................................................ 17
1.3.4. REPORT INFORMATIVO FILE-FATTURE .......................................................................................... 17
1.3.5. REPORT RIEPILOGATIVO SU DOWNLOAD FILE-FATTURE PER IDSDI ............................................... 18
1.3.6. REGISTRI IVA ............................................................................................................................ 19
1.3.7. FILE MASSIVI LIPE ................................................................................................................... 19
1.3.8. SCARICO PRECOMPILATA IVA .............................................................................................. 19
1.3.9. DATI DI SINTESI DELLE FATTURE EMESSE E RICEVUTE DA RSM .................................... 19
2. TRASMISSIONE MASSIVA BOLLO ELENCHI B ............................................................................. 21
2.1. FILE DI ESITO TRASMISSIONE ........................................................................................................... 21
2.2. ESITO DATI MASSIVI BOLLO ELENCHI B .......................................................................................... 22
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 3 di 22
STATO DEL DOCUMENTO
MODIFICHE INTRODOTTE NELLA v1.5
PARAGRAFO PARAGRAFO
1.1 Richiesta Massiva
Aggiornato il tracciato InputMassivo alla versione v1.5:
- aggiunto il blocco < FattureDataAcc> per richiedere il
download dei file-fatture o un loro elenco (in formato
csv) accolti dal SdI in un dato intervallo temporale. Il
nuovo blocco permetterà di ottenere i file-fatture
afferenti al proprio flusso di fatturazione sia attiva che
passiva. In caso di richieste in qualità di
cessionario/committente, il download di archivi
contenenti file-fatture messi a disposizione sul cassetto
fiscale varrà come presa visione di questi ultimi.
Tutto il documento
Revisione delle tabelle descrittive dei tracciati
MODIFICHE INTRODOTTE NELLA v1.4
PARAGRAFO PARAGRAFO
1.1 Richiesta Massiva
Aggiornato il tracciato InputMassivo alla versione v1.4:
- aggiunto l’elemento <Dichiarazione> per il blocco
<IvaPrecompilata> per il servizio massivo Documenti IVA
precompilati
- aggiunto il blocco <Elenchi> con il nuovo elemento
<ElencoVidimazioniFattureRSM> per lo scarico dei dati di
sintesi delle fatture emesse e ricevute da RSM
MODIFICHE INTRODOTTE NELLA v1.3
PARAGRAFO DESCRIZIONE
1.1 Richiesta Massiva
Aggiornato il tracciato InputMassivo alla versione v1.3:
- aggiunto il blocco <Lipe> per il servizio massivo
Documenti IVA precompilati
- introdotta la possibilità di indicare più partite IVA in caso
di richieste di report di scarico fatture
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 4 di 22
MODIFICHE INTRODOTTE NELLA v1.2
PARAGRAFO DESCRIZIONE
1.1 Richiesta Massiva
Aggiornata descrizione tabellare di
RichiestaServiziMassivi_v1.0.xsd
Aggiornato il tracciato InputMassivo alla versione v1.2:
- aggiunto il blocco <IvaPrecompilata> per nuovo servizio
massivo Documenti IVA precompilati
- introdotta la possibilità di indicare più partite IVA in caso
di richieste di scarico fatture e corrispettivi
1.2 File di Esito della richiesta di scarico
massivo Aggiornata descrizione tabellare di ScaricoRichiesteEsito
_v1.0.xsd
MODIFICHE INTRODOTTE NELLA v1.1
PARAGRAFO DESCRIZIONE
1. Richiesta Massiva Aggiornato il tracciato InputMassivo alla versione v1.1,
nell’elemento <Fatture>:
- aggiunto l’elemento opzionale <TipoOutput> tramite cui
il richiedente può indicare se è interessato ai file-fatture,
oppure al report (in formato csv) contenete gli estremi
degli stessi;
- aggiunto l’elemento <FattureSDI> in cui è possibile
indicare una lista di identificativi SdI di cui il richiedente
vuole i file-fatture.
1.3.4 Report informativo file-fatture Descrizione del report informativo ottenuto dalla richiesta
massiva di file-fatture nel caso in cui l’utente abbia richiesto il
report, anziché il file-fatture.
1.3.5 Report riepilogativo su download
file-fatture per IdSdI
Descrizione del report che viene ridato a corredo dei file-fatture
in caso di richiesta massiva in cui è indicata la lista di IdSdI
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 5 di 22
1. SERVIZI DI SCARICO MASSIVO
Nel presente paragrafo si descrivono i tracciati dei file scambiati nella comunicazione con i servizi
massivi scarico file (SMTS) in cooperazione applicativa.
1.1. RICHIESTA MASSIVA
In allegato alla SOAP request della operazione inoltroRichiesta deve esser trasmessa la richiesta
massiva costituita da un file xml conforme al tracciato RichiestaServiziMassivi_v1.0.xsd descritto di
seguito e firmata digitalmente nei formati:
- CAdES-BES (CMS Advanced Electronic Signatures) con struttura aderente alla specifica pubblica ETSI
TS 101 733 V1.7.4, così come previsto dalla normativa vigente in materia a partire dal 1
settembre 2010;
- XAdES-BES (XML Advanced Electronic Signatures), con struttura aderente alla specifica pubblica ETSI
TS 101 903 versione 1.4.1, così come previsto dalla normativa vigente in materia a partire dal 1
settembre 2010.
ID NOME ELEMENTO VALORI AMMESSI NOTE
1 FileRichiesta Contiene la richiesta XML da
inoltrare ai servizi massivi
1.1 TipoRichiesta Pattern definiti in StringType • FATT: da indicare per lo scarico
massivo di fatture e dati di sintesi
delle fatture emesse e ricevute da
RSM,
• CORR: da indicare per lo scarico
massivo di corrispettivi,
• BOLLO_AB: da indicare per lo scarico
massivo di bollo A e bollo B,
• BOLLO_B: da indicare solo nel caso
di trasmissione di bollo B.
• IVA: da indicare per lo scarico dei
documenti IVA precompilati
1.2 NomeFile Pattern definiti in NomeFileType
1.3 File Il file codificato in formato base-64 File XML in cui è riportato il blocco
informativo necessario a eseguire
l’operazione di scarico o
trasmissione richiesta
1.4 Signature Gestisce l’eventuale firma Xades
@versione 1.0 Attributo di FileRichiesta che
contiene la versione dell’XSD.
Unico valore ammesso 1.0
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 6 di 22
Il file XML codificato in base-64 nella richiesta massiva riportato nell’elemento File deve a sua volta
essere alternativamente conforme:
- al tracciato ScaricoBollo_v1.0.xsd, nel caso in cui si volesse scaricare gli elenchi bollo A e B;
- al tracciato InputMassivo_v1.5.xsd, nel caso in cui si volesse scaricare file-fatture, dati di
sintesi di fatture emesse e ricedute da RSM, dati corrispettivi, dati iva precompilati.
Di seguito è fornita la descrizione del tracciato ScaricoBollo_v1.0.xsd.
ID NOME ELEMENTO VALORI AMMESSI NOTE
1 ScaricoBollo Rappresenta l’XML codificato in base-64
nella richiesta XML da inoltrare ai
servizi massivi
1.1 PartitaIva Pattern definiti in PivaType Partita IVA
1.2 Anno Pattern definiti in AnnoType Anno di riferimento
1.3 Trimestre Pattern definiti in TrimestreType Trimestre di riferimento (1,2,3,4)
@versione 1.0 Attributo di ScaricoBollo che contiene
la versione dell’XSD.
Unico valore ammesso 1.0
Nella seguente tabella è, invece, descritto il tracciato InputMassivo_v1.5.xsd
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
1 InputMassivo Rappresenta l’XML codificato
in base-64 nella richiesta
XML da inoltrare ai servizi
massivi
1.1 TipoRichiesta
1.1.1 Fatture Blocco da inserire in caso di
scarico di file-fatture
(alternativo a Corrispettivi).
1.1.1.1 Richiesta FATT Indica la tipologia di
richiesta. Nel caso di fatture,
l’unico valore ammesso è la
stringa FATT
1.1.1.2 ElencoPiva
1.1.1.2.1 Piva Pattern definiti in
PivaType (stringa
numerica costituita da
11 cifre)
Elemento di tipo PivaType
corrispondente alla partita
IVA del titolare dei dati.
E’ possibile indicare più (al
più 30) partite IVA nella
stessa richiesta di scarico
fatture a meno del blocco
FattureSDI; in questo caso è
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 7 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
possibile indicare una sola
partita IVA.
1.1.1.3 TipoRicerca Pattern definito in
La ricerca puntuale riguarda
TipoRicercaType, ossia
le fatture dove il cedente o il
una stringa fra i valori:
cessionario è identificato da
una delle partite IVA indicate.
PUNTUALE
La ricerca completa riguarda
COMPLETA
le fatture dove il cedente o il
cessionario è identificato da
una delle partite IVA indicate
e dalle sue collegate; inoltre,
con tale scelta, saranno
scaricate anche quelle
fatture in cui la partita IVA
identifica una PNF e
nell’identificativo del
cessionario è indicato il
codice fiscale in assenza di
partita iva.
1.1.1.4 TipoOutput ELENCO
FILE_FATTURA
Se valorizzato con
FILE_FATTURA (o non
presente) il sistema restituirà
uno o più zip contenenti file-
fatture e metadati.
Se valorizzato con ELENCO
restituisce uno zip
contenente un CSV con gli
estremi dei file fatture.
1.1.1.5 FattureEmesse Alternativo a
FattureFEDisposizione/Fattur
eRicevute/FattureSDI/Fatture
DataAcc
1.1.1.5.1 DataEmissione
1.1.1.5.1.1 Da AAAA-MM-GG Range di date di emissione
della fattura; non può
superare i 3 mesi.
1.1.1.5.1.2 A AAAA-MM-GG
1.1.1.5.2 Flusso
1.1.1.5.2.1 Tutte ALL Include nella estrazione tutte
le fatture (alternativo a
FatturaB2B e FatturaPA).
L’unico valore permesso
nell’elemento è la stringa
ALL.
1.1.1.5.2.2 FatturaB2B Pattern definiti in
Limita l’estrazione alle sole le
FatturaB2BEmesseType,
fatture afferenti al flusso
ossia una fra le seguenti
B2B-B2C (alternativo a Tutte
stringhe:
e FatturaPA).
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 8 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
E’ possibile estendere la
ALL
ricerca a tutte le fatture
CON
emesse B2B, oppure a quelle
consegnate:
ALL = tutte
CON = fatture consegnate
1.1.1.5.2.3 FatturaPA Pattern definiti in
FatturaPAEmesseType,
ossia una fra le seguenti
stringhe:
ALL
CON
ACC
RIF
DEC
IMP
Limita l’estrazione alle sole
fatture afferenti al flusso B2G
(alternativo a Tutte e
FatturaB2B) ed indica a quali
si è interessate.
ALL= tutte
CON= consegnate
ACC= accettate
RIF= rifiutate
DEC= in decorrenza termini
IMP= in impossibilità di
recapito
1.1.1.5.3 Ruolo CEDENTE Valore fisso.
1.1.1.6 FattureFEDisposi
Alternativo a
zione
FattureEmesse/FattureRicevu
te/FattureSDI/FattureDataAcc
1.1.1.6.1 DataEmissione
1.1.1.6.1.1 Da AAAA-MM-GG Range di date di emissione
della fattura; non può
superare i 3 mesi
1.1.1.6.1.2 A AAAA-MM-GG
1.1.1.6.2 Ruolo CESSIONARIO Valore fisso.
1.1.1.7 FattureRicevute Alternativo a FattureEmesse/
FattureFEDisposizione
/FattureSDI/FattureDataAcc
1.1.1.7.1 DataEmissione Alternativo a DataRicezione
1.1.1.7.1.1 Da AAAA-MM-GG Range di date di emissione
della fattura; non può
superare i 3 mesi
1.1.1.7.1.2 A AAAA-MM-GG
1.1.1.7.2 DataRicezione Alternativo a DataEmissione
1.1.1.7.2.1 Da AAAA-MM-GG Range di date di emissione
della fattura; non può
superare i 3 mesi
1.1.1.7.2.2 A AAAA-MM-GG
1.1.1.7.3 Flusso
1.1.1.7.3.1 Tutte ALL Include nella estrazione tutte
le fatture (alternativo a
FatturaB2B e FatturaPA).
L’unico valore permesso
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 9 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
nell’elemento è la stringa
ALL.
1.1.1.7.3.2 FatturaB2B Pattern definiti in
FatturaB2BRicevuteTyp
e, ossia una fra le
seguenti stringhe:
ALL
CON
Limita l’estrazione alle sole le
fatture afferenti al flusso
B2B-B2C (alternativo a Tutte
e FattureB2B).
E’ possibile estendere la
ricerca a tutte le fatture
emesse B2B, oppure a quelle
consegnate:
ALL = tutte
CON = fatture consegnate
1.1.1.7.3.3 FatturaPA Pattern definiti in
Limita l’estrazione alle sole
FatturaPARicevuteType,
fatture afferenti al flusso B2G
ossia una fra le seguenti
(alternativo a Tutte e
stringhe:
FatturaB2B) e indica a quali si
è interessati:
ALL
ALL= tutte
CON
CON= consegnate
ACC
ACC= accettate
RIF
RIF= rifiutate
DEC
DEC= in decorrenza termini
1.1.1.7.4 Ruolo CESSIONARIO Valore fisso.
1.1.1.8 FattureSDI Alternativo a FattureEmesse/
FattureFEDisposizione
/FattureRicevute/FattureData
Acc
1.1.1.8.1 IdSdI Identificativo SdI del file-
fatture che si vuole scaricare
(al più 10 000 istanze)
1.1.1.9 FattureDataAcc Alternativo a FattureEmesse/
FattureFEDisposizione
/FattureRicevute/FattureSDI
1.1.1.9.1 DataAccoglienza
1.1.1.9.1.1 Da AAAA-MM-GG Range di date di accoglienza
presso SdI della fattura; non
può superare i 3 mesi
1.1.1.9.1.2 A AAAA-MM-GG
1.1.1.9.2 Flusso
1.1.1.9.2.1 Tutte ALL Include nella estrazione tutte
le fatture (alternativo a
FatturaB2B e FatturaPA).
L’unico valore permesso
nell’elemento è la stringa
ALL.
1.1.1.9.2.2 FatturaB2B Pattern definiti in
Limita l’estrazione alle sole le
FatturaB2BAccType,
fatture afferenti al flusso
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 10 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
ossia una fra le seguenti
B2B-B2C (alternativo a Tutte
stringhe:
e FattureB2B).
E’ possibile estendere la
ALL
ricerca a tutte le fatture
CON
emesse B2B, oppure a quelle
consegnate:
ALL = tutte
CON = fatture consegnate
1.1.1.9.2.3 FatturaPA Pattern definiti in
FatturaPAAccType, ossia
una fra le seguenti
stringhe:
ALL
CON
ACC
RIF
DEC
Limita l’estrazione alle sole
fatture afferenti al flusso B2G
(alternativo a Tutte e
FatturaB2B) e indica a quali si
è interessati:
ALL= tutte
CON= consegnate
ACC= accettate
RIF= rifiutate
DEC= in decorrenza termini
1.1.1.9.3 Ruolo
1.1.1.9.3.1 Cedente Valore fisso: CEDENTE Alternativo a Cessionario. Da
inserire nel caso si sia
interessati al proprio flusso
di fatturazione attiva
1.1.1.9.3.2 Cessionario Valore fisso:
Alternativo a Cedente. Da
CESSIONARIO
inserire nel caso si sia
interessati al proprio flusso
di fatturazione passiva.
1.1.2 Corrispettivi Blocco da inserire in caso di
scarico di corrispettivi
(alternativo a Fatture).
1.1.2.1 Richiesta CORR Indica la tipologia di
richiesta. Nel caso di
corrispettivi, l’unico valore
ammesso è la stringa CORR
1.1.2.2 DataRilevazione
1.1.2.2.1 Da
1.1.2.2.2 A
1.1.2.3 ElencoPiva
1.1.2.3.1 Piva Pattern definiti in
Elemento di tipo PivaType
PivaType (stringa
corrispondente alla partita
numerica costituita da
IVA del titolare dei dati.
11 cifre)
E’ possibile indicare più (al
più 30) partite IVA nella
stessa richiesta di scarico
corrispettivi.
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 11 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
1.1.2.4 TipoCorrispettivo Pattern definito in
RT= registratori telematici
TipoCorrispettivoType,
MC = multicassa
ossia una stringa fra i
DA = distributori automatici
valori:
DC = documenti commerciali
RT, MC, DA, DC, RC
on-line
RC = registratori di cassa
1.1.3 Elenchi
Blocco da inserire in caso di
scarico dei dati di sintesi
delle fatture emesse e
ricevute da RSM
Pattern definito in
TipoElencoType:
1.1.3.1 Richiesta
ELENCO_VIDIMAZIONI_R
SM
1.1.3.2 ElencoPiva
Pattern definiti in
Un unico elemento di tipo
PivaType (stringa
PivaType corrispondente alla
1.1.3.2.1 Piva
numerica costituita da
partita IVA dell’utenza di
11 cifre)
lavoro
Pattern definito in
TipoRicercaType, ossia
una stringa fra i valori:
PUNTUALE
COMPLETA
1.1.3.3 TipoRicerca
La ricerca puntuale riguarda
le fatture dove il cedente o il
cessionario è identificato da
una delle partite IVA indicate.
La ricerca completa riguarda
le fatture dove il cedente o il
cessionario è identificato da
una delle partite IVA indicate
e dalle sue collegate; inoltre,
con tale scelta, saranno
scaricate anche quelle
fatture in cui la partita IVA
identifica una PNF e
nell’identificativo del
cessionario è indicato il
codice fiscale in assenza di
partita iva.
Blocco da inserire in caso di
1.1.3.4 ElencoVidimazion
iFattureRSM
scarico dei dati di sintesi
delle fatture emesse o
ricevute da RSM
1.1.3.4.1 FattureEmesse Alternativo a FattureRicevute
1.1.3.4.1.1 DataEmissione Alternativo a
DataVidimazione
1.1.3.4.1.1.1 Da AAAA-MM-GG Range di date di emissione
de dati di sintesi delle fatture
di RSM; non può superare i 3
mesi
1.1.3.4.1.1.2 A AAAA-MM-GG
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 12 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
1.1.3.4.1.1.3 VidimazioneEm Pattern definito in
TipoVidimazioneType,
ossia una stringa fra i
valori:
ESITATE
NON_ESITATE
TUTTE
1.1.3.4.1.2 DataVidimazione
1.1.3.4.1.2.1 Da AAAA-MM-GG Range di date di emissione
de dati di sintesi delle fatture
di RSM; non può superare i 3
mesi
1.1.3.4.1.2.2 A AAAA-MM-GG
1.1.3.4.1.2.3 VidimazioneVid ESITATE Valore fisso.
1.1.3.4.2 FattureRicevute Alternativo a FattureEmesse
1.1.3.4.2.1 DataEmissione Alternativo a DataRicezione e
DataVidimazione
1.1.3.4.2.1.1 Da AAAA-MM-GG Range di date di emissione
de dati di sintesi delle fatture
di RSM; non può superare i 3
mesi
1.1.3.4.2.1.2 A AAAA-MM-GG
1.1.3.4.2.1.3 VidimazioneEm Pattern definito in
TipoVidimazioneType,
ossia una stringa fra i
valori:
ESITATE
NON_ESITATE
TUTTE
1.1.3.4.2.2 DataRicezione Alternativo a DataEmissione
e DataVidimazione
1.1.3.4.2.2.1 Da AAAA-MM-GG Range di date di emissione
de dati di sintesi delle fatture
di RSM; non può superare i 3
mesi
1.1.3.4.2.2.2 A AAAA-MM-GG
1.1.3.4.2.2.3 VidimazioneRic Pattern definito in
TipoVidimazioneType,
ossia una stringa fra i
valori:
ESITATE
NON_ESITATE
TUTTE
1.1.3.4.2.3 DataVidimazione Alternativo a DataEmissione
e DataRicezione
1.1.3.4.2.3.1 Da AAAA-MM-GG Range di date di emissione
de dati di sintesi delle fatture
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 13 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
di RSM; non può superare i 3
mesi
1.1.3.4.2.3.2 A AAAA-MM-GG
1.1.3.4.2.3.3 VidimazioneVid ESITATE Valore fisso.
1.1.3.4.2.4 Ruolo CESSIONARIO Valore fisso.
Blocco da inserire in caso di
scarico dei documenti IVA
1.1.4 IvaPrecompilata
precompilati (alternativo a
Fatture e Corrispettivi).
1.1.4.1 Richiesta IVA
Indica la tipologia di
richiesta. Nel caso dei
documenti IVA precompilati,
l’unico valore ammesso è la
stringa IVA
1.1.4.2 ElencoPiva
1.1.4.2.1 Piva
Pattern definiti in
PivaType (stringa
numerica costituita da
11 cifre)
Un unico elemento di tipo
PivaType corrispondente alla
partita IVA dell’utenza di
lavoro
1.1.4.3 Ricerca PUNTUALE Valore fisso.
1.1.4.4 Anno Formato AAAA Indica l’anno di interesse.
Indica il mese d’interesse o il
1,2,3,4,5,6,7,8,9,10,11,12
trimestre di interesse. E’
101 (primo trimestre)
possibile indicare un
1.1.4.5 Mese
102 (secondo trimestre)
trimestre solo in caso di
103 (terzo trimestre)
prospetto riepilogativo.
104 (quarto trimestre)
1.1.4.6 Registro
Blocco da inserire in caso di
scarico di un registro IVA
(alternativo a Prospetto).
1.1.4.6.1 TipoRichiesta REGI Valore fisso.
1.1.4.6.2 TipoOutput
Pattern definito in
OutputFileType:
XML
CSV
PDF
TXT
Indica l’estensione del file
che si vuole richiedere. Il
formato xml è previsto solo
per i registri IVA completi
d’acquisti e di vendite.
Pattern definito in
RegistroType:
Indica la tipologia di registro
1.1.4.6.3 TipoRegistro
0 (reg. completo)
IVA d’interesse.
1 (reg. delle vendite)
2 (reg. degli acquisti)
1.1.4.7 Prospetto
Blocco da inserire in caso di
scarico di un registro IVA
(alternativo a Registro).
1.1.4.7.1 TipoRichiesta PROS Valore fisso.
1.1.4.8 Lipe Blocco da inserire in caso di
scarico di liquidazioni iva.
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 14 di 22
NOME
ID
VALORI AMMESSI NOTE
ELEMENTO
1.1.4.8.1 TipoRichiesta LIPE Valore fisso.
1.1.4.8.2 TipoOutput
Pattern definito in
OutputFileType:
XML
CSV
PDF
TXT
Indica l’estensione del file
che si vuole richiedere. Per le
Lipe è previsto il solo
formato xml e pdf.
Pattern definito in
StatoModelloType:
E’ possibile indicare
1.1.4.8.3 StatoModello
PRECOMPILATA
entrambe le tipologie
INLAVORAZIONE
definite dal pattern
INVIATA
1.1.4.9 Dichiarazione
Blocco da inserire in caso di
scarico della dichiarazione
precompilata iva
1.1.4.9.1 TipoRichiesta DICH Valore fisso.
1.1.4.9.2 TipoOutput
Pattern definito in
OutputFileType:
XML
CSV
PDF
TXT
Indica l’estensione del file
che si vuole richiedere. Per la
dichiarazione è previsto il
solo formato pdf e txt.
Pattern definito in
StatoModelloType:
E’ possibile indicare
1.1.4.9.3 StatoModello
PRECOMPILATA
entrambe le tipologie
INLAVORAZIONE
definite dal pattern
INVIATA
1.1.4.9.4 TipoModello
Pattern definito in
TipoModelloType;
0 ( INVIO )
1 (CORRETTIVA)
2 (INTEGRATIVA)
E’ possibile indicare il tipo di
modello solo nel caso in cui
lo stato modello scelto sia
INVIATA
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 15 di 22
1.2. FILE DI ESITO DELLA RICHIESTA DI SCARICO MASSIVO
Nel presente paragrafo viene descritto il tracciato dell’esito della richiesta che si ottiene in allegato
alla operazione EsitoRichiesta definito in ScaricoRichiesteEsito_v1.0.xsd:
ID NOME ELEMENTO VALORI AMMESSI NOTE
1 EsitoRichiesta Rappresenta l’esito della richiesta XML
di scarico inoltrata
1.1 IdRichiesta L’identificativo univoco, generato dal
sistema, che contraddistingue una
richiesta
1.2 Piva Pattern definiti in
Partita IVA titolare dei dati. In caso di
PivaType
una richiesta in cui sono state indicate
più partite IVA viene valorizzato con
00000000000 (undici zeri)
1.3 DataFineDisponibilita La data indica il termine ultimo entro il
quale è possibile richiamare i servizi
legati alla richiesta, compreso il
download dei file.
1.4 NumeroArchivi Indica il numero dei file relativi ad una
richiesta con esito positivo
1.5 NumeroErrori Indica il numero degli errori legati ad
una richiesta con esito negativo
1.6 Esito Pattern definiti in
All’interno del tag esito è previsto il
EsitoType
riferimento alla lista dei file oppure
alla lista degli errori
1.6.1 ElencoArchivi Pattern definiti in
ElencoArchiviType
Rappresenta il contenitore degli
archivi restituiti in caso di esito
positivo.
1.6.1.1 Archivio Pattern definiti in
Identifica l’entità del singolo archivio
ArchivioType
generato in caso di esito positivo,
elemento della lista
1.6.1.1.1 IdFile Il riferimento univoco all’interno del
sistema, dell’archivio restituito
1.6.1.1.2 NomeFile Il nome dell’archivio restituito
1.6.1.1.3 DimensioneFile Indica la dimensione dell’archivio, in
byte
1.6.1.1.4 TipoElementi Fatt – fatture
Indica la tipologia di elementi
Corr – corrispettivi
contenuti nell’archivio; ogni archivio
può contenere solo una tipologia di
Bollo_a – bollo a
elementi
Bollo_b – bollo b
IVA_REGI – registri IVA
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
ID NOME ELEMENTO VALORI AMMESSI IVA_PROS – prospetti
IVA
IVA_DICH –
dichiarazioni IVA
annuale
FATT_ELENCO_VIDIMAZI
ONI_RSM – dati di
sintesi fatture RSM
1.6.1.1.5 NumeroElementi 1.6.2 ElencoErrori Pattern definiti in
ElencoErroriType
1.6.2.1 Errore Pattern definiti in
ErroreType
1.6.2.1.1 Codice 1.6.2.1.2 Descrizione @versione 1.0 Pag. 16 di 22
NOTE
Indica il numero di elementi contenuti
nell’archivio
Rappresenta il contenitore degli errori
restituiti e che hanno comportato un
esito negativo, lista di errori
Identifica l’entità del singolo errore
riscontrato e che ha comportato un
esito negativo, elemento della lista
Codice univoco legato all’errore
Descrizione dettagliata dell’errore
Attributo di EsitoRichiesta che
contiene la versione dell’XSD. Unico
valore ammesso 1.0
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 17 di 22
1.3. FILE PRESENTI NEGLI ARCHIVI CREATI
Di seguito le strutture delle varie tipologie di file che sono resi disponibili all’utente negli archivi creati
e scaricabili dall’operazione ScaricoFile.
1.3.1. DATI MASSIVI CORRISPETTIVI
Per i file corrispettivi si rimanda alle specifiche tecniche pubblicate sul sito dell’AdE al seguente link:
- https://www.agenziaentrate.gov.it/portale/web/guest/schede/comunicazioni/fatture-e-
corrispettivi/fatture-e-corrispettivi-st/st-invio-corrispettivi-registratori-telematici-temp
1.3.2. FILE MASSIVI FATTURE
Per i file massivi delle fatture si rimanda alle specifiche tecniche pubblicate sul sito dell’Agenzia per
la fatturazione tra privati e sul sito FatturaPA per la fatturazione con le PA ai seguenti link:
- https://www.agenziaentrate.gov.it/portale/web/guest/fatturazione-elettronica-e-dati-
fatture-transfrontaliere-new
- https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fatturapa/
Negli archivi generati, ogni file-fatture è accompagnato da un file di metadati in formato xml
individuabile tramite il suo nome in quanto costituito dal nome del file-fatture di riferimento seguito
dalla stringa “_metaDato”. In tale file sono riportate diverse informazioni relative al file-fatture fra
cui hash del file (hashfile), identificativo SdI (idfile), data accoglienza presso SdI (dataaccoglienza).
1.3.3. DATI MASSIVI BOLLO ELENCHI A-B
Gli elenchi A e B sono conformi ai rispettivi tracciati descritti nelle specifiche tecniche pubblicate al
seguente link
1.3.4. REPORT INFORMATIVO FILE-FATTURE
A seguito di una richiesta massiva relativa a file-fatture in cui è stata richiesta la generazione del
report, lo zip conterrà un file csv con la seguente struttura.
STRUTTURA REPORT
NOME COLONNA DESCRIZIONE INFORMAZIONE
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 18 di 22
Nome file Nome del file-fatture
Formato Formato del file-fatture (FPR, FSM, FPA)
Tipo documento Tipo documento riportato nel file (TD01, …)
Numero Numero della fattura
Data emissione Data di emissione riportata
Codice fiscale cliente (o fornitore) Codice fiscale del cessionario/committente o del
cedente/prestatore (a seconda del tipo di flusso di
fatturazione è stato indicato)
Id Paese cliente (o fornitore) Identificativo del Paese del soggetto fiscale
Partita Iva cliente (o fornitore) Partita IVA del cessionario/committente o del
cedente/prestatore (a seconda del tipo di flusso di
fatturazione è stato indicato)
Denominazione cliente (o
fornitore)
Denominazione del cessionario/committente o del
cedente/prestatore (a seconda del tipo di flusso di
fatturazione è stato indicato)
IdSdI Identificativo SdI assegnato al file-fatture
Fattura Attiva/passiva Tipo di fatturazione richiesta (Attiva o passiva)
Data Consegna/presa visione Data della consegna del file-fatture al destinatario e della
presa visione
Data messa a disposizione Data della messa a disposizione del file-fatture sul cassetto
fiscale
Stato Stato del file: Scartato,Mancata Consegna,Consegnato
Data Accoglienza SdI Data di accoglienza presso SdI del file-fatture
Codice Destinatario Codice destinatario
1.3.5. REPORT RIEPILOGATIVO SU DOWNLOAD FILE-FATTURE PER IDSDI
A seguito di una richiesta massiva relativa a file-fatture in cui è stata richiesto il download dei file-
fatture indicando gli identificativi SdI, all’interno del primo archivio vi sarà un report in formato csv
in cui saranno riportati gli id sdi elencati nella richiesta. Di seguito la struttura di tale report
STRUTTURA REPORT RIEPILOGATIVO
NOME COLONNA DESCRIZIONE INFORMAZIONE
Nome zip Nome dello zip in cui è contenuto il file-fatture
Nome file Nome del file-fatture
IdSdI Identificativo SdI
Numero Numero della fattura
Stato Esito del download ( 0 in caso di file-fatture individuato, un
codice diverso nel caso non sia stato possibile individuarlo)
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 19 di 22
Di seguito sono riportati gli eventuali errori nel caso in cui gli id sdi indicati dall’utente nell’input non
sono disponibili:
DECODIFICA DEI CODICI DI ERRORE
CODICE DESCRIZIONE
500 Id non presente a sistema
501 Id non di competenza del soggetto IVA
502 Id non rientrante nell’accordo di consultazione
503 File-fattura non ancora a disposizione del sistema
1.3.6. REGISTRI IVA
Per i file massivi dei registri iva si rimanda alle specifiche tecniche pubblicate sul sito dell’Agenzia al
seguenti link:
- https://www.agenziaentrate.gov.it/portale/web/guest/-/provvedimento-8-luglio-2021
1.3.7. FILE MASSIVI LIPE
Per i file massivi delle lipe si rimanda alle specifiche tecniche pubblicate sul sito dell’Agenzia al
seguenti link:
- https://www.agenziaentrate.gov.it/portale/web/guest/schede/comunicazioni/liquidazio
ni-periodiche-iva/st-comunicazione-delle-liquidazioni-periodiche-iva
1.3.8. SCARICO PRECOMPILATA IVA
A seguito di una richiesta massiva relativa allo scarico della precompilata iva all’interno dell’archivio
vi sarà un report in formato pdf o txt in cui sarà riportata la dichiarazione precompilata iva
dell’annualità richiesta.
1.3.9. DATI DI SINTESI DELLE FATTURE EMESSE E RICEVUTE DA RSM
A seguito di una richiesta massiva relativa allo scarico dei dati di sintesi delle fatture emesse e
ricevute dalla repubblica di San Marino all’interno dell’archivio vi sarà un report in formato csv
contenenti i seguenti campi:
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 20 di 22
STRUTTURA REPORT
NOME COLONNA DESCRIZIONE INFORMAZIONE
ID_SDI Identificativo SDI
TIPO_INVIO Tipologia Invio
TIPO_DOCUMENTO Tipologia documento
CEDENTE_ID_PAESE_PIVA Codice paese del cedente
CEDENTE_PIVA P. IVA del cedente
CEDENTE_COD_FISC Codice fiscale del cedente
CEDENTE_DENOMINAZIONE Denominazione del cedente
CESSIONARIO_ID_PAESE_PIVA Codice paese del cessionario
CESSIONARIO_PIVA P. IVA del cessionario
CESSIONARIO_COD_FISC Codice fiscale del cessionario
CESSIONARIO_DENOMINAZIONE Denominazione del cessionario
NUMERO_FATTURA Numero fattura
DATA_FATTURA Data fattura
TOTALE_IMPONIBILE Totale imponibile
TOTALE_IMPOSTA Totale imposta
ESITO_DI_VIDIMAZIONE Esito di vidimazione
DATA_DI_VIDIMAZIONE Data di vidimazione
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 21 di 22
2. TRASMISSIONE MASSIVA BOLLO ELENCHI B
Il presente paragrafo descrive le regole tecniche relative alle soluzioni informatiche da utilizzare per
i servizi di trasmissione di file massivi in cooperazione applicativa.
Per l’utilizzo dei servizi massivi occorre predisporre una richiesta in formato XML seguendo le
specifiche del tracciato XSD così come descritte nel paragrafo 1.1. con l’’unica differenza che Il file
codificato in base-64 riportato nella richiesta massiva nell’elemento File è l’elenco bollo B il cui
tracciato è descritto al link riportato nel paragrafo 1.3.3
2.1. FILE DI ESITO TRASMISSIONE
Di seguito sono riportati i valori per codificare il file di Esito ottenuto nella response della operazione
EsitoTrasmissione. La struttura è riportata nel file TrasmissioneEsito_v1.0.xsd
VALORI
ID NOME ELEMENTO
NOTE
AMMESSI
1 EsitoTrasmissione Rappresenta l’esito della richiesta XML di
trasmissione inoltrata
1.1 IdTrasmissione L’identificativo univoco, generato dal sistema,
che contraddistingue una trasmissione
1.2 Piva Pattern definiti
in PivaType
1.3 DataFineDisponibilita La data indica il termine ultimo entro il quale
è possibile richiamare i servizi legati alla
richiesta, compreso il download dei file;
1.4 NumeroArchivi Indica il numero dei file relativi ad una
richiesta con esito positivo
1.5 NumeroErrori Indica il numero degli errori legati ad una
richiesta con esito negativo
1.6 Esito Pattern definiti
All’interno del tag esito è previsto il file di esito
in EsitoType
oppure la lista degli errori
1.6.1 EsitoFile Pattern definiti
in FileType
E’ previsto il tag solo in caso di esito positivo
1.6.1.1 NomeFile Pattern definiti
Il nome del file restituito
in NomeType
1.6.1.2 File Il file restituito, codificato in base-64 include i
dati proposti dall’utente nel file Elenco B
trasmesso e l’esito di ciascuna modifica
riportato nell’elemento <esito>
1.6.2 ElencoErrori Pattern definiti
Rappresenta il contenitore degli errori
in
restituiti e che hanno comportato un esito
ElencoErroriTy
negativo, lista di errori
pe
Specifiche Tecniche del formato dei file
utilizzati dai Servizi Massivi di Trasmissione e Scarico file
Pag. 22 di 22
VALORI
ID NOME ELEMENTO
NOTE
AMMESSI
1.6.2.1 Errore Pattern definiti
in ErroreType
Identifica l’entità del singolo errore riscontrato
e che ha comportato un esito negativo,
elemento della lista
1.6.2.1.1 Codice Codice univoco legato all’errore
1.6.2.1.2 Descrizione Descrizione dettagliata dell’errore
@versione 1.0 Attributo di EsitoTrasmissione che contiene la
versione dell’XSD.
Unico valore ammesso 1.0
2.2. ESITO DATI MASSIVI BOLLO ELENCHI B
Il file di esito messo a disposizione dell’utente ad elaborazione terminata rispetta il tracciato
TramsElencoBOutput_v1.0.xsd consultabile sul sito dell’Agenzia delle Entrate.
La decodifica dei diversi esiti è consultabile al seguente link.