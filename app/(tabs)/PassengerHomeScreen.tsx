import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Dimensions,
  Switch,
  Modal,
} from 'react-native';

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import DateTimePicker from '@react-native-community/datetimepicker';

// ÍCONES
import {
  ArrowLeft,
  Briefcase,
  Car,
  Clock,
  DollarSign,
  Home,
  MapPin,
  Menu,
  Navigation,
  Search,
  User,
  Filter,
  X,
  CreditCard,
  LifeBuoy,
  LogOut,
  MicOff,
  History,
  Settings,
} from 'lucide-react-native';

// NAVEGAÇÃO
import { useNavigation } from '@react-navigation/native';

// Cores do projeto
const COLORS = {
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#C9C3C3',
  darkGray: '#909090',
  black: '#141414',
  primary: '#6E17EB',
  danger: '#EA4335',
  success: '#34A853',
};

const GOOGLE_MAPS_API_KEY_AQUI = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;
const CONFIRMED_PANEL_HEIGHT = screenHeight * 0.5;
const DRAWER_WIDTH = screenWidth * 0.8;

// Componente de atalho
const FavoriteShortcut = ({ icon: Icon, title, onPress }: { icon: React.ElementType; title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.shortcutButton} onPress={onPress}>
    <View style={styles.shortcutIconContainer}>
      <Icon color={COLORS.primary} size={20} />
    </View>
    <Text style={styles.shortcutTitle}>{title}</Text>
  </TouchableOpacity>
);

// Marcador de destino
const DestinationMarker = () => (
  <View style={styles.destinationMarkerContainer}>
    <View style={styles.destinationMarkerPin} />
    <View style={styles.destinationMarkerTail} />
  </View>
);

// Preço dinâmico
const calculateDynamicPrice = (distanceInKm: number): string => {
  const currentHour = new Date().getHours();
  const basePrice = 10;
  let pricePerKm = 3.5;

  if ((currentHour >= 7 && currentHour < 9) || (currentHour >= 17 && currentHour < 20)) {
    pricePerKm *= 1.2;
  } else if (currentHour >= 20 || currentHour < 6) {
    pricePerKm *= 1.4;
  }

  const total = basePrice + distanceInKm * pricePerKm;
  return `R$ ${total.toFixed(2)}`;
};

const getPeriodLabel = (): string => {
  const h = new Date().getHours();
  if ((h >= 7 && h < 9) || (h >= 17 && h < 20)) return 'Horário de Rush (+20%)';
  if (h >= 20 || h < 6) return 'Noturno (+40%)';
  return 'Diurno';
};

// TELA PRINCIPAL
export default function PassengerHomeScreen() {
  const navigation = useNavigation<any>();

  // Função centralizada para ir ao perfil
  const goToProfile = () => {
    navigation.navigate('PassengerProfileScreen');
  };

  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [origin, setOrigin] = useState<Location.LocationObjectCoords | null>(null);
  const [originAddress, setOriginAddress] = useState('Sua Localização Atual');
  const [destination, setDestination] = useState<Location.LocationObjectCoords | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');

  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);

  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; price: string } | null>(null);

  const [viewState, setViewState] = useState<'idle' | 'selecting' | 'confirmed'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);

  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('cartao');

  // Modais
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Filtros reais
  const [driverGender, setDriverGender] = useState('any');
  const [minDriverRating, setMinDriverRating] = useState('any');
  const [wantsSilentDriver, setWantsSilentDriver] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState('any');
  const [maxDistance, setMaxDistance] = useState('any');

  // Filtros temporários (modal)
  const [tempDriverGender, setTempDriverGender] = useState(driverGender);
  const [tempMinDriverRating, setTempMinDriverRating] = useState(minDriverRating);
  const [tempWantsSilentDriver, setTempWantsSilentDriver] = useState(wantsSilentDriver);
  const [tempPaymentPreference, setTempPaymentPreference] = useState(paymentPreference);
  const [tempMaxDistance, setTempMaxDistance] = useState(maxDistance === 'any' ? '' : maxDistance);
  const [maxDistancePlaceholder, setMaxDistancePlaceholder] = useState('Qualquer');

  // Animações
  const drawerAnimation = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const drawerOverlayOpacity = useRef(new Animated.Value(0)).current;
  const panelAnimation = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const mapRef = useRef<MapView>(null);

  // Localização inicial
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos da sua localização.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = location.coords;
      setUserLocation(coords);
      setOrigin(coords);
      mapRef.current?.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    })();
  }, []);

  // Animação do painel
  useEffect(() => {
    Animated.spring(panelAnimation, {
      toValue: viewState === 'selecting' || viewState === 'confirmed' ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [viewState]);

  // Teclado
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => {
      Animated.spring(keyboardOffset, { toValue: -e.endCoordinates.height + 100, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      Animated.spring(keyboardOffset, { toValue: 0, useNativeDriver: true }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Drawer
  const openDrawer = () => {
    setIsDrawerVisible(true);
    Animated.parallel([
      Animated.timing(drawerAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(drawerOverlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnimation, { toValue: -DRAWER_WIDTH, duration: 300, useNativeDriver: true }),
      Animated.timing(drawerOverlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setIsDrawerVisible(false));
  };

  const resetAddressFields = () => {
    setOriginAddress('Sua Localização Atual');
    setDestinationAddress('');
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setDestination(null);
    setOrigin(userLocation);
    setActiveField(null);
    setRouteInfo(null);
    setIsScheduling(false);
    setScheduledDate(null);
    setPaymentMethod('cartao');
  };

  const geocodeAddress = async (address: string): Promise<Location.LocationObjectCoords | null> => {
    if (!GOOGLE_MAPS_API_KEY_AQUI) return null;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY_AQUI}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== 'OK' || !data.results?.length) throw new Error();
      const loc = data.results[0].geometry.location;
      return { latitude: loc.lat, longitude: loc.lng, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null };
    } catch {
      Alert.alert('Erro', 'Endereço não encontrado');
      return null;
    }
  };

  const fetchAutocomplete = async (text: string, field: 'origin' | 'destination') => {
    if (text.length < 3) {
      field === 'origin' ? setOriginSuggestions([]) : setDestinationSuggestions([]);
      return;
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY_AQUI}&language=pt_BR`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK') {
        field === 'origin' ? setOriginSuggestions(data.predictions) : setDestinationSuggestions(data.predictions);
      }
    } catch (e) { console.log(e); }
  };

  const handleConfirmTrajeto = async () => {
    if (!originAddress || !destinationAddress) return Alert.alert('Erro', 'Preencha origem e destino');
    setIsLoading(true);
    const finalOrigin = originAddress === 'Sua Localização Atual' ? userLocation : await geocodeAddress(originAddress);
    const finalDest = await geocodeAddress(destinationAddress);
    if (finalOrigin && finalDest) {
      setOrigin(finalOrigin);
      setDestination(finalDest);
      setViewState('confirmed');
      setScheduledDate(isScheduling ? scheduleDate : null);
    }
    setIsLoading(false);
  };

  const onSuggestionPress = (suggestion: any, field: 'origin' | 'destination') => {
    if (field === 'origin') setOriginAddress(suggestion.description);
    else setDestinationAddress(suggestion.description);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    Keyboard.dismiss();
  };

  const handleStartRide = () => {
    Alert.alert(
      scheduledDate ? 'Agendar Corrida' : 'Iniciar Corrida',
      scheduledDate ? 'Deseja agendar agora?' : 'Deseja chamar o motorista agora?',
      [{ text: 'Confirmar', onPress: () => console.log('Corrida iniciada/agendada') }]
    );
  };

  const handleOpenFilterModal = () => {
    setTempDriverGender(driverGender);
    setTempMinDriverRating(minDriverRating);
    setTempWantsSilentDriver(wantsSilentDriver);
    setTempPaymentPreference(paymentPreference);
    setTempMaxDistance(maxDistance === 'any' ? '' : maxDistance);
    setMaxDistancePlaceholder(maxDistance === 'any' ? 'Qualquer' : '');
    setIsFilterModalVisible(true);
  };

  const handleSaveFilters = () => {
    setDriverGender(tempDriverGender);
    setMinDriverRating(tempMinDriverRating);
    setWantsSilentDriver(tempWantsSilentDriver);
    setPaymentPreference(tempPaymentPreference);
    setMaxDistance(tempMaxDistance.trim() === '' ? 'any' : tempMaxDistance);
    setIsFilterModalVisible(false);
  };

  // RENDER PANELS (mantidos como no seu original)
  const renderIdlePanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Olá, Passageiro!</Text>
      <Text style={styles.panelSubtitle}>Onde seu carro precisa ir?</Text>
      <TouchableOpacity style={styles.searchButton} onPress={() => setViewState('selecting')}>
        <Search color={COLORS.primary} size={24} />
        <Text style={styles.searchButtonText}>Para onde vamos?</Text>
      </TouchableOpacity>
      <View style={styles.shortcutsContainer}>
        <FavoriteShortcut icon={Home} title="Casa" onPress={() => {}} />
        <FavoriteShortcut icon={Briefcase} title="Trabalho" onPress={() => {}} />
        <FavoriteShortcut icon={MapPin} title="Recentes" onPress={() => {}} />
      </View>
    </View>
  );

  const selectingTranslateY = Animated.add(
    panelAnimation.interpolate({ inputRange: [0, 1], outputRange: [panelHeight || 450, 0] }),
    keyboardOffset
  );

  const renderSelectingPanel = () => (
    <Animated.View style={[styles.bottomPanelSelecting, { transform: [{ translateY: selectingTranslateY }] }]} onLayout={e => setPanelHeight(e.nativeEvent.layout.height)}>
      <ScrollView contentContainerStyle={styles.selectingScrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.selectionHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setViewState('idle'); resetAddressFields(); Keyboard.dismiss(); }}>
            <ArrowLeft color={COLORS.black} size={24} />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Definir Trajeto</Text>
        </View>
        {/* Inputs de Origem/Destino e Sugestões */}
         <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>ORIGEM</Text>
          <TextInput
            style={styles.textInput}
            value={originAddress}
            onChangeText={(text) => { setOriginAddress(text); fetchAutocomplete(text, 'origin'); }}
            onFocus={() => setActiveField('origin')}
            onBlur={() => setActiveField(null)}
          />
          {activeField === 'origin' && originSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {originSuggestions.map((item) => (
                  <TouchableOpacity key={item.place_id} style={styles.suggestionItem} onPress={() => onSuggestionPress(item, 'origin')}>
                    <MapPin color={COLORS.primary} size={18} />
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>DESTINO</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Digite o destino..."
            value={destinationAddress}
            onChangeText={(text) => { setDestinationAddress(text); fetchAutocomplete(text, 'destination'); }}
            onFocus={() => setActiveField('destination')}
            onBlur={() => setActiveField(null)}
          />
          {activeField === 'destination' && destinationSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {destinationSuggestions.map((item) => (
                  <TouchableOpacity key={item.place_id} style={styles.suggestionItem} onPress={() => onSuggestionPress(item, 'destination')}>
                    <MapPin color={COLORS.primary} size={18} />
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

         {/* Botão Confirmar */}
         <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmTrajeto} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmButtonText}>Confirmar Trajeto</Text>}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );

  const confirmedTranslateY = panelAnimation.interpolate({ inputRange: [0, 1], outputRange: [CONFIRMED_PANEL_HEIGHT, 0] });

  const renderConfirmedPanel = () => (
    <Animated.View style={[styles.bottomPanel, { transform: [{ translateY: confirmedTranslateY }], height: CONFIRMED_PANEL_HEIGHT }]}>
      <ScrollView contentContainerStyle={styles.selectingScrollContent}>
        <View style={styles.routeInfoHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => { setViewState('selecting'); setDestination(null); }}>
            <ArrowLeft color={COLORS.black} size={24} />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Detalhes</Text>
        </View>
        
        {routeInfo && (
          <View style={styles.routeInfoContainer}>
             <View style={styles.routeInfoItem}>
                <Text style={styles.routeInfoLabel}>Distância: </Text>
                <Text style={styles.routeInfoValue}>{routeInfo.distance}</Text>
             </View>
             <View style={styles.routeInfoItem}>
                <Text style={styles.routeInfoLabel}>Preço: </Text>
                <Text style={styles.routeInfoValue}>{routeInfo.price}</Text>
             </View>
          </View>
        )}

        <TouchableOpacity style={styles.requestDriverButton} onPress={handleStartRide}>
            <Text style={styles.requestDriverButtonText}>Iniciar Corrida</Text>
        </TouchableOpacity>

      </ScrollView>
    </Animated.View>
  );

  // --- RESTAURAÇÃO DA MODAL DE FILTROS ---
  const renderFilterModal = () => (
    <Modal visible={isFilterModalVisible} animationType="slide" transparent onRequestClose={() => setIsFilterModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Preferências de Viagem</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}><X color={COLORS.black} size={26} /></TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 25, paddingTop: 20 }}>
             {/* Gênero */}
             <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Gênero do Motorista</Text>
              <View style={styles.segmentedControl}>
                {['any', 'female', 'male'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.segment, tempDriverGender === opt && styles.segmentActive]}
                    onPress={() => setTempDriverGender(opt)}
                  >
                    <Text style={[styles.segmentText, tempDriverGender === opt && styles.segmentTextActive]}>
                      {opt === 'any' ? 'Qualquer' : opt === 'female' ? 'Feminino' : 'Masculino'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nota Mínima */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Nota Mínima</Text>
              <View style={styles.segmentedControl}>
                {['any', '4', '4.5'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.segment, tempMinDriverRating === opt && styles.segmentActive]}
                    onPress={() => setTempMinDriverRating(opt)}
                  >
                    <Text style={[styles.segmentText, tempMinDriverRating === opt && styles.segmentTextActive]}>
                      {opt === 'any' ? 'Qualquer' : opt + '+'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pagamento */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Pagamento</Text>
              <View style={styles.segmentedControl}>
                {['any', 'cartao', 'dinheiro', 'pix'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.segment, tempPaymentPreference === opt && styles.segmentActive]}
                    onPress={() => setTempPaymentPreference(opt)}
                  >
                    <Text style={[styles.segmentText, tempPaymentPreference === opt && styles.segmentTextActive]}>
                      {opt === 'any' ? 'Qualquer' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distância */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Distância Máxima (km)</Text>
              <TextInput
                style={styles.filterInput}
                value={tempMaxDistance}
                onChangeText={setTempMaxDistance}
                onFocus={() => setMaxDistancePlaceholder('')}
                onBlur={() => !tempMaxDistance && setMaxDistancePlaceholder('Qualquer')}
                placeholder={maxDistancePlaceholder}
                placeholderTextColor={COLORS.mediumGray}
                keyboardType="numeric"
              />
            </View>

            {/* Motorista Silencioso */}
            <View style={styles.filterGroup}>
              <View style={styles.switchRow}>
                <MicOff color={COLORS.black} size={22} />
                <Text style={styles.filterLabelSwitch}>Motorista Silencioso</Text>
                <Switch
                  value={tempWantsSilentDriver}
                  onValueChange={setTempWantsSilentDriver}
                  trackColor={{ false: COLORS.mediumGray, true: COLORS.primary }}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterModalFooter}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveFilters}>
              <Text style={styles.saveButtonText}>Salvar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // --- MENU LATERAL ATUALIZADO ---
  const renderSideMenu = () => (
    <Modal animationType="none" transparent visible={isDrawerVisible} onRequestClose={closeDrawer}>
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[styles.drawerOverlay, { opacity: drawerOverlayOpacity }]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: drawerAnimation }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerAvatar}><User size={30} color={COLORS.primary} /></View>
            <View>
              <Text style={styles.drawerUserName}>Olá, João!</Text>
              <Text style={styles.drawerUserEmail}>joao.silva@email.com</Text>
            </View>
          </View>
          <ScrollView>
            {/* TODAS AS OPÇÕES AGORA LEVAM PARA goToProfile() */}
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); goToProfile(); }}>
              <User color={COLORS.primary} size={22} />
              <Text style={styles.drawerLabel}>Meu Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); goToProfile(); }}>
              <Car color={COLORS.primary} size={22} />
              <Text style={styles.drawerLabel}>Meu Veículo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); goToProfile(); }}>
              <CreditCard color={COLORS.primary} size={22} />
              <Text style={styles.drawerLabel}>Pagamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); goToProfile(); }}>
              <History color={COLORS.primary} size={22} />
              <Text style={styles.drawerLabel}>Histórico de Viagens</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); goToProfile(); }}>
              <Settings color={COLORS.primary} size={22} />
              <Text style={styles.drawerLabel}>Configurações</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); goToProfile(); }}>
              <LifeBuoy color={COLORS.primary} size={22} />
              <Text style={styles.drawerLabel}>Ajuda e Suporte</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert('Sair', 'Tem certeza que deseja sair?'); }}>
              <LogOut color={COLORS.danger} size={22} />
              <Text style={[styles.drawerLabel, { color: COLORS.danger }]}>Sair</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE} showsUserLocation={false} showsMyLocationButton={false}>
        {userLocation && <Marker coordinate={userLocation}><View style={styles.userMarker}><View style={styles.userMarkerCore} /></View></Marker>}
        {destination && <Marker coordinate={destination}><DestinationMarker /></Marker>}
        {origin && destination && GOOGLE_MAPS_API_KEY_AQUI && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY_AQUI}
            strokeWidth={4}
            strokeColor={COLORS.primary}
            onReady={result => {
              const distanceInKm = result.distance;
              const durationInMin = Math.ceil(result.duration);
              setRouteInfo({
                distance: `${distanceInKm.toFixed(1)} km`,
                duration: `${durationInMin} min`,
                price: calculateDynamicPrice(distanceInKm),
              });
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 150, right: 50, bottom: CONFIRMED_PANEL_HEIGHT + 20, left: 50 },
                animated: true,
              });
            }}
          />
        )}
      </MapView>

      {viewState === 'selecting' && <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={styles.keyboardDismissOverlay} /></TouchableWithoutFeedback>}

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={openDrawer}><Menu color={COLORS.black} size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Pilotaí</Text>
        <View style={styles.headerRightColumn}>
          <TouchableOpacity style={styles.iconButton} onPress={goToProfile}><User color={COLORS.black} size={28} /></TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.filterButton]} onPress={handleOpenFilterModal}><Filter color={COLORS.black} size={24} /></TouchableOpacity>
        </View>
      </View>

      {viewState === 'idle' && renderIdlePanel()}
      {viewState === 'selecting' && renderSelectingPanel()}
      {viewState === 'confirmed' && renderConfirmedPanel()}

      {renderFilterModal()}
      {renderSideMenu()}
    </SafeAreaView>
  );
}

// ESTILOS COMPLETOS (Atualizados com estilos da modal e filtros)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  map: { ...StyleSheet.absoluteFillObject },
  keyboardDismissOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', zIndex: 10 },
  headerContainer: { position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight : 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginTop: 10, zIndex: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.black },
  iconButton: { padding: 8, backgroundColor: COLORS.white, borderRadius: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerRightColumn: { flexDirection: 'column', alignItems: 'center', gap: 12 },
  filterButton: { padding: 6, borderRadius: 20 },
  bottomPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, zIndex: 30 },
  bottomPanelSelecting: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, zIndex: 30 },
  selectingScrollContent: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  panelTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, textAlign: 'center' },
  panelSubtitle: { fontSize: 16, color: COLORS.darkGray, marginBottom: 20, marginTop: 5, textAlign: 'center' },
  searchButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 15, paddingHorizontal: 20, paddingVertical: 18, marginBottom: 25 },
  searchButtonText: { fontSize: 18, fontWeight: '600', color: COLORS.darkGray, marginLeft: 15 },
  shortcutsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  shortcutButton: { alignItems: 'center', flex: 1 },
  shortcutIconContainer: { backgroundColor: COLORS.lightGray, borderRadius: 25, width: 50, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  shortcutTitle: { fontSize: 14, fontWeight: '500', color: COLORS.black },
  userMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(110, 23, 235, 0.2)', justifyContent: 'center', alignItems: 'center' },
  userMarkerCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white },
  destinationMarkerContainer: { alignItems: 'center', justifyContent: 'flex-end' },
  destinationMarkerPin: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white, elevation: 3 },
  destinationMarkerTail: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: COLORS.primary, marginTop: -1 },
  selectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  backButton: { position: 'absolute', left: 0, padding: 5 },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  drawerContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, backgroundColor: COLORS.white, zIndex: 50 },
  drawerHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, marginTop: 20 },
  drawerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  drawerUserName: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  drawerUserEmail: { fontSize: 14, color: COLORS.darkGray },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 16 },
  drawerLabel: { fontSize: 16, fontWeight: '500', color: COLORS.black },
  drawerFooter: { borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingVertical: 10 },
  
  // Estilos da Modal de Filtro restaurados
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '95%', marginTop: 'auto' },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  filterModalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
  filterModalFooter: { paddingHorizontal: 25, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  filterGroup: { marginBottom: 24 },
  filterLabel: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  segmentedControl: { flexDirection: 'row', width: '100%', borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  segmentTextActive: { color: COLORS.white },
  filterInput: { backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.black },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterLabelSwitch: { fontSize: 16, fontWeight: '600', color: COLORS.black, flex: 1, marginLeft: 12 },

  // Inputs e botões gerais
  inputContainer: { width: '100%', marginBottom: 18, position: 'relative' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.darkGray, marginBottom: 8, textTransform: 'uppercase' },
  textInput: { backgroundColor: COLORS.lightGray, borderRadius: 12, paddingVertical: 18, paddingHorizontal: 16, fontSize: 16, color: COLORS.black, fontWeight: '500', minHeight: 56 },
  confirmButton: { backgroundColor: COLORS.primary, borderRadius: 15, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 3, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  confirmButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  suggestionsContainer: { position: 'absolute', left: 0, right: 0, top: 68, borderRadius: 12, backgroundColor: COLORS.white, borderColor: COLORS.mediumGray, borderWidth: 1, maxHeight: 180, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, zIndex: 40 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  suggestionText: { fontSize: 15, color: COLORS.black, marginLeft: 12, flex: 1, fontWeight: '500' },
  routeInfoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  routeInfoContainer: { backgroundColor: COLORS.lightGray, borderRadius: 15, padding: 15, marginBottom: 14 },
  routeInfoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  routeInfoLabel: { fontSize: 13, color: COLORS.darkGray, fontWeight: '500' },
  routeInfoValue: { fontSize: 18, color: COLORS.black, fontWeight: 'bold', marginLeft: 8 },
  requestDriverButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, elevation: 3, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  requestDriverButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});