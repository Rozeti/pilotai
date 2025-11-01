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
  ArrowLeft, Briefcase, Car, Clock, DollarSign, Home, MapPin, Menu,
  Navigation, Search, User, Filter, X, CreditCard, Shield, LifeBuoy,
  LogOut, MicOff, Users, History, Settings,
} from 'lucide-react-native';

// Cores do projeto
const COLORS = {
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#C9C3C3',
  darkGray: '#909090',
  black: '#141414',
  primary: '#6E17EB',
  lightPurple: '#A065F5',
  danger: '#EA4335',
  success: '#34A853',
};

const GOOGLE_MAPS_API_KEY_AQUI = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;
const CONFIRMED_PANEL_HEIGHT = screenHeight * 0.5;
const DRAWER_WIDTH = screenWidth * 0.8;

// Componente de atalho
const FavoriteShortcut = ({
  icon: Icon,
  title,
  onPress,
}: {
  icon: React.ElementType;
  title: string;
  onPress: () => void;
}) => (
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

// Função para calcular preço dinâmico
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
  const currentHour = new Date().getHours();
  if ((currentHour >= 7 && currentHour < 9) || (currentHour >= 17 && currentHour < 20)) {
    return 'Horário de Rush (+20%)';
  } else if (currentHour >= 20 || currentHour < 6) {
    return 'Noturno (+40%)';
  } else {
    return 'Diurno';
  }
};

// =================================================================
// === TELA PRINCIPAL (MAPA) =======================================
// =================================================================
export default function PassengerHomeScreen() {
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [origin, setOrigin] = useState<Location.LocationObjectCoords | null>(null);
  const [originAddress, setOriginAddress] = useState('Sua Localização Atual');
  const [destination, setDestination] = useState<Location.LocationObjectCoords | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');

  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);

  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    price: string;
  } | null>(null);

  const [viewState, setViewState] = useState<'idle' | 'selecting' | 'confirmed'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);

  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('cartao');

  // === ESTADOS PARA OS MODAIS ===
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Filtros para passageiro
  const [driverGender, setDriverGender] = useState('any');
  const [minDriverRating, setMinDriverRating] = useState('any');
  const [wantsSilentDriver, setWantsSilentDriver] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState('any');
  const [maxDistance, setMaxDistance] = useState('any');
  const [tempDriverGender, setTempDriverGender] = useState(driverGender);
  const [tempMinDriverRating, setTempMinDriverRating] = useState(minDriverRating);
  const [tempWantsSilentDriver, setTempWantsSilentDriver] = useState(wantsSilentDriver);
  const [tempPaymentPreference, setTempPaymentPreference] = useState(paymentPreference);
  const [tempMaxDistance, setTempMaxDistance] = useState(maxDistance === 'any' ? '' : maxDistance);
  const [maxDistancePlaceholder, setMaxDistancePlaceholder] = useState('Qualquer');

  // === ANIMAÇÕES ===
  const drawerAnimation = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const drawerOverlayOpacity = useRef(new Animated.Value(0)).current;

  const mapRef = useRef<MapView>(null);
  const originInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const panelAnimation = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  // Animar painel
  useEffect(() => {
    if (viewState === 'selecting' || viewState === 'confirmed') {
      Animated.spring(panelAnimation, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }).start();
    } else {
      Animated.spring(panelAnimation, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
    }
  }, [viewState]);

  // Listener para teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      const moveUp = -e.endCoordinates.height + 100;
      Animated.spring(keyboardOffset, { toValue: moveUp, friction: 8, tension: 50, useNativeDriver: true }).start();
    });
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.spring(keyboardOffset, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }).start();
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Pedir permissão de localização
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos da sua permissão de localização.');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = location.coords;
        setUserLocation(coords);
        setOrigin(coords);
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível obter sua localização.');
      }
    })();
  }, []);

  const openDrawer = () => {
    setIsDrawerVisible(true);
    Animated.parallel([
      Animated.timing(drawerAnimation, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(drawerOverlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnimation, { toValue: -DRAWER_WIDTH, duration: 300, useNativeDriver: true }),
      Animated.timing(drawerOverlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
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
    setScheduleDate(new Date());
    setScheduledDate(null);
    setPaymentMethod('cartao');
  };

  const geocodeAddress = async (address: string): Promise<Location.LocationObjectCoords | null> => {
    if (!GOOGLE_MAPS_API_KEY_AQUI || GOOGLE_MAPS_API_KEY_AQUI.length < 10) {
      Alert.alert('API Key Faltando', 'Adicione sua chave de API do Google.');
      return null;
    }
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY_AQUI}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error('Endereço não encontrado');
      }
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat, longitude: location.lng,
        altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null,
      };
    } catch (error) {
      console.error(error);
      Alert.alert('Erro de Geocodificação', `Não foi possível encontrar: ${address}`);
      return null;
    }
  };

  const fetchAutocomplete = async (text: string, field: 'origin' | 'destination') => {
    if (text.length < 3) {
      if (field === 'origin') setOriginSuggestions([]);
      else setDestinationSuggestions([]);
      return;
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY_AQUI}&language=pt_BR`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK') {
        if (field === 'origin') setOriginSuggestions(data.predictions);
        else setDestinationSuggestions(data.predictions);
      } else {
        if (field === 'origin') setOriginSuggestions([]);
        else setDestinationSuggestions([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmTrajeto = async () => {
    if (!originAddress || !destinationAddress) {
      Alert.alert('Campos vazios', 'Preencha a origem e o destino.');
      return;
    }
    setIsLoading(true);
    let finalOriginCoords = origin;
    if (originAddress !== 'Sua Localização Atual') {
      finalOriginCoords = await geocodeAddress(originAddress);
    } else {
      finalOriginCoords = userLocation;
    }
    const finalDestinationCoords = await geocodeAddress(destinationAddress);
    if (finalOriginCoords && finalDestinationCoords) {
      setOrigin(finalOriginCoords);
      setDestination(finalDestinationCoords);
      setOriginSuggestions([]);
      setDestinationSuggestions([]);
      setActiveField(null);
      Keyboard.dismiss();
      setScheduledDate(isScheduling ? scheduleDate : null);
      setViewState('confirmed');
    } else {
      Alert.alert('Erro', 'Não foi possível definir o trajeto.');
    }
    setIsLoading(false);
  };

  const onSuggestionPress = async (suggestion: any, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setOriginAddress(suggestion.description);
      setOriginSuggestions([]);
    } else {
      setDestinationAddress(suggestion.description);
      setDestinationSuggestions([]);
    }
    Keyboard.dismiss();
  };

  const handleStartRide = () => {
    const title = scheduledDate ? 'Agendar Corrida' : 'Iniciar Corrida';
    const message = scheduledDate ? 'Deseja agendar a corrida agora?' : 'Deseja iniciar a corrida agora?';
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => {
          console.log(scheduledDate ? `Agendando corrida para ${scheduledDate.toLocaleString()}` : 'Corrida iniciada');
          console.log(`Forma de pagamento: ${paymentMethod}`);
          console.log('Filtros aplicados:', { driverGender, wantsSilentDriver });
        },
      },
    ]);
  };

  const handleMenuPress = () => openDrawer();
  const handleProfilePress = () => openDrawer();

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

  // --- RENDERIZAÇÃO DOS PAINÉIS ---

  const renderIdlePanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Olá, Passageiro!</Text>
      <Text style={styles.panelSubtitle}>Onde seu carro precisa ir?</Text>
      <TouchableOpacity style={styles.searchButton} onPress={() => setViewState('selecting')} activeOpacity={0.7}>
        <Search color={COLORS.primary} size={24} />
        <Text style={styles.searchButtonText}>Para onde vamos?</Text>
      </TouchableOpacity>
      <View style={styles.shortcutsContainer}>
        <FavoriteShortcut icon={Home} title="Casa" onPress={() => console.log('Ir para Casa')} />
        <FavoriteShortcut icon={Briefcase} title="Trabalho" onPress={() => console.log('Ir para Trabalho')} />
        <FavoriteShortcut icon={MapPin} title="Recentes" onPress={() => console.log('Ver Recentes')} />
      </View>
    </View>
  );

  const selectingTranslateY = Animated.add(
    panelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [panelHeight || 450, 0],
    }),
    keyboardOffset
  );

  const renderSelectingPanel = () => (
    <Animated.View
      style={[
        styles.bottomPanelSelecting,
        { transform: [{ translateY: selectingTranslateY }] },
      ]}
      onLayout={({ nativeEvent }) => setPanelHeight(nativeEvent.layout.height)}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.selectingScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectionHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setViewState('idle');
              resetAddressFields();
              Keyboard.dismiss();
            }}>
            <ArrowLeft color={COLORS.black} size={24} />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Definir Trajeto</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>ORIGEM</Text>
          <TextInput
            ref={originInputRef}
            style={styles.textInput}
            value={originAddress}
            onChangeText={(text) => {
              setOriginAddress(text);
              fetchAutocomplete(text, 'origin');
            }}
            placeholder="Digite o endereço de partida..."
            placeholderTextColor={COLORS.darkGray}
            onFocus={() => {
              setActiveField('origin');
              setDestinationSuggestions([]);
            }}
            onBlur={() => setActiveField(null)}
          />
          {activeField === 'origin' && originSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
                {originSuggestions.map((item) => (
                  <TouchableOpacity key={item.place_id} style={styles.suggestionItem} onPress={() => onSuggestionPress(item, 'origin')}>
                    <MapPin color={COLORS.primary} size={18} />
                    <Text style={styles.suggestionText} numberOfLines={2}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>DESTINO</Text>
          <TextInput
            ref={destinationInputRef}
            style={styles.textInput}
            placeholder="Digite o endereço de destino..."
            placeholderTextColor={COLORS.darkGray}
            value={destinationAddress}
            onChangeText={(text) => {
              setDestinationAddress(text);
              fetchAutocomplete(text, 'destination');
            }}
            onFocus={() => {
              setActiveField('destination');
              setOriginSuggestions([]);
            }}
            onBlur={() => setActiveField(null)}
          />
          {activeField === 'destination' && destinationSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
                {destinationSuggestions.map((item) => (
                  <TouchableOpacity key={item.place_id} style={styles.suggestionItem} onPress={() => onSuggestionPress(item, 'destination')}>
                    <MapPin color={COLORS.primary} size={18} />
                    <Text style={styles.suggestionText} numberOfLines={2}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>AGENDAR CORRIDA</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={isScheduling}
              onValueChange={setIsScheduling}
              trackColor={{ false: COLORS.mediumGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
            <Text style={styles.switchLabel}>{isScheduling ? 'Sim' : 'Não'}</Text>
          </View>
          {isScheduling && (
            <>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View style={styles.textInput}>
                  <Text style={styles.pickerText}>{scheduleDate.toLocaleDateString('pt-BR')}</Text>
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const newDate = new Date(scheduleDate);
                      newDate.setFullYear(selectedDate.getFullYear());
                      newDate.setMonth(selectedDate.getMonth());
                      newDate.setDate(selectedDate.getDate());
                      setScheduleDate(newDate);
                    }
                  }}
                />
              )}
              <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                <View style={styles.textInput}>
                  <Text style={styles.pickerText}>{scheduleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      const newDate = new Date(scheduleDate);
                      newDate.setHours(selectedTime.getHours());
                      newDate.setMinutes(selectedTime.getMinutes());
                      setScheduleDate(newDate);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmTrajeto} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmButtonText}>Confirmar Trajeto</Text>}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );

  const confirmedTranslateY = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [CONFIRMED_PANEL_HEIGHT, 0],
  });

  const renderConfirmedPanel = () => (
    <Animated.View style={[styles.bottomPanel, {
      transform: [{ translateY: confirmedTranslateY }],
      height: CONFIRMED_PANEL_HEIGHT,
      paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0,
    }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.selectingScrollContent}>
        <View style={styles.routeInfoHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setViewState('selecting');
              setDestination(null);
              setRouteInfo(null);
              setScheduledDate(null);
            }}>
            <ArrowLeft color={COLORS.black} size={24} />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Detalhes da Viagem</Text>
        </View>

        {scheduledDate && (
          <View style={styles.scheduledInfo}>
            <Clock color={COLORS.primary} size={24} />
            <Text style={styles.scheduledText}>{`Agendada para ${scheduledDate.toLocaleString('pt-BR')}`}</Text>
          </View>
        )}

        {routeInfo && (
          <View style={styles.routeInfoContainer}>
            <View style={styles.routeInfoItem}>
              <Navigation color={COLORS.primary} size={24} />
              <View style={styles.routeInfoText}>
                <Text style={styles.routeInfoLabel}>Distância</Text>
                <Text style={styles.routeInfoValue}>{routeInfo.distance}</Text>
              </View>
            </View>
            <View style={styles.routeInfoItem}>
              <Clock color={COLORS.primary} size={24} />
              <View style={styles.routeInfoText}>
                <Text style={styles.routeInfoLabel}>Tempo Estimado</Text>
                <Text style={styles.routeInfoValue}>{routeInfo.duration}</Text>
              </View>
            </View>
            <View style={styles.routeInfoItem}>
              <DollarSign color={COLORS.primary} size={24} />
              <View style={styles.routeInfoText}>
                <Text style={styles.routeInfoLabel}>Valor Estimado</Text>
                <Text style={styles.routeInfoValue}>{routeInfo.price}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>{getPeriodLabel()}</Text>
        </View>

        <View style={styles.addressesContainer}>
          <View style={styles.addressItem}>
            <View style={styles.originDot} />
            <Text style={styles.addressText} numberOfLines={1}>{originAddress}</Text>
          </View>
          <View style={styles.addressDivider} />
          <View style={styles.addressItem}>
            <MapPin color={COLORS.primary} size={20} />
            <Text style={styles.addressText} numberOfLines={1}>{destinationAddress}</Text>
          </View>
        </View>

        <View style={styles.paymentContainer}>
          <Text style={styles.inputLabel}>FORMA DE PAGAMENTO</Text>
          <View style={styles.picker}>
            <TouchableOpacity onPress={() => setPaymentMethod('cartao')}>
              <Text style={paymentMethod === 'cartao' ? styles.selectedPayment : styles.paymentOption}>Cartão</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaymentMethod('dinheiro')}>
              <Text style={paymentMethod === 'dinheiro' ? styles.selectedPayment : styles.paymentOption}>Dinheiro</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaymentMethod('pix')}>
              <Text style={paymentMethod === 'pix' ? styles.selectedPayment : styles.paymentOption}>Pix</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.confirmActions}>
          <TouchableOpacity style={styles.requestDriverButton} onPress={handleStartRide} activeOpacity={0.8}>
            <Car color={COLORS.white} size={20} />
            <Text style={styles.requestDriverButtonText}>{scheduledDate ? 'Agendar Corrida' : 'Iniciar Corrida'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setViewState('selecting');
              setDestination(null);
              setRouteInfo(null);
              setScheduledDate(null);
            }}
            activeOpacity={0.8}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );

  const renderFilterModal = () => (
    <Modal visible={isFilterModalVisible} animationType="slide" transparent onRequestClose={() => setIsFilterModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          {/* Header */}
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Preferências de Viagem</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} style={styles.closeButton}>
              <X color={COLORS.black} size={26} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo */}
          <ScrollView style={styles.filterScrollView} contentContainerStyle={{ paddingBottom: 20 }}>
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

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Nota Mínima do Motorista</Text>
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

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Forma de Pagamento</Text>
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

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Distância Máxima para Buscar Motorista (km)</Text>
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

          {/* Botão Fixo */}
          <View style={styles.filterModalFooter}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveFilters}>
              <Text style={styles.saveButtonText}>Salvar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSideMenu = () => (
    <Modal animationType="none" transparent visible={isDrawerVisible} onRequestClose={closeDrawer}>
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[styles.drawerOverlay, { opacity: drawerOverlayOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: drawerAnimation }] }]}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerAvatar}>
              <User size={30} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.drawerUserName}>Olá, João!</Text>
              <Text style={styles.drawerUserEmail}>joao.silva@email.com</Text>
            </View>
          </View>
          <ScrollView>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert("Navegação", "Indo para Meu Perfil"); }}>
              <User color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Meu Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert("Navegação", "Indo para Meu Veículo"); }}>
              <Car color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Meu Veículo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert("Navegação", "Indo para Pagamentos"); }}>
              <CreditCard color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Pagamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert("Navegação", "Indo para Histórico"); }}>
              <History color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Histórico de Viagens</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert("Navegação", "Indo para Configurações"); }}>
              <Settings color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Configurações</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert("Navegação", "Indo para Ajuda"); }}>
              <LifeBuoy color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Ajuda e Suporte</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert('Sair', 'Tem certeza que deseja sair?'); }}>
              <LogOut color={COLORS.danger} size={22} /><Text style={[styles.drawerLabel, { color: COLORS.danger }]}>Sair</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: -23.55052, longitude: -46.633308,
          latitudeDelta: 0.0922, longitudeDelta: 0.0421,
        }}>
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarker}><View style={styles.userMarkerCore} /></View>
          </Marker>
        )}
        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1.0 }}>
            <DestinationMarker />
          </Marker>
        )}
        {origin && destination && GOOGLE_MAPS_API_KEY_AQUI && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY_AQUI}
            strokeWidth={4}
            strokeColor={COLORS.primary}
            onReady={(result) => {
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

      {viewState === 'selecting' && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.keyboardDismissOverlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
          <Menu color={COLORS.black} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilotaí</Text>
        <View style={styles.headerRightColumn}>
          <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
            <User color={COLORS.black} size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.filterButton]} onPress={handleOpenFilterModal}>
            <Filter color={COLORS.black} size={24} />
          </TouchableOpacity>
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

// =================================================================
// === ESTILOS =====================================================
// =================================================================
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
  destinationMarkerPin: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 1.5 },
  destinationMarkerTail: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: COLORS.primary, marginTop: -1 },
  selectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  backButton: { position: 'absolute', left: 0, padding: 5 },
  inputContainer: { width: '100%', marginBottom: 18, position: 'relative' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.darkGray, marginBottom: 8, textTransform: 'uppercase' },
  textInput: { backgroundColor: COLORS.lightGray, borderRadius: 12, paddingVertical: 18, paddingHorizontal: 16, fontSize: 16, color: COLORS.black, fontWeight: '500', minHeight: 56 },
  confirmButton: { backgroundColor: COLORS.primary, borderRadius: 15, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 3, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  confirmButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  suggestionsContainer: { position: 'absolute', left: 0, right: 0, top: 68, borderRadius: 12, backgroundColor: COLORS.white, borderColor: COLORS.mediumGray, borderWidth: 1, maxHeight: 180, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, zIndex: 40 },
  suggestionsList: { flexGrow: 0 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  suggestionText: { fontSize: 15, color: COLORS.black, marginLeft: 12, flex: 1, fontWeight: '500' },
  routeInfoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  routeInfoContainer: { backgroundColor: COLORS.lightGray, borderRadius: 15, padding: 15, marginBottom: 14 },
  routeInfoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  routeInfoText: { marginLeft: 12, flex: 1 },
  routeInfoLabel: { fontSize: 13, color: COLORS.darkGray, fontWeight: '500' },
  routeInfoValue: { fontSize: 18, color: COLORS.black, fontWeight: 'bold', marginTop: 2 },
  addressesContainer: { backgroundColor: COLORS.lightGray, borderRadius: 15, padding: 12, marginBottom: 14 },
  addressItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  originDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginRight: 12 },
  addressText: { fontSize: 15, color: COLORS.black, flex: 1, fontWeight: '500' },
  addressDivider: { height: 1, backgroundColor: COLORS.mediumGray, marginVertical: 8 },
  requestDriverButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, elevation: 3, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  requestDriverButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginLeft: 10 },
  confirmActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancelButton: { marginLeft: 12, backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
  cancelButtonText: { color: COLORS.darkGray, fontSize: 16, fontWeight: '700' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  switchLabel: { marginLeft: 10, fontSize: 16, color: COLORS.black },
  pickerText: { fontSize: 16, color: COLORS.black, paddingVertical: 18, paddingHorizontal: 16 },
  scheduledInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 15, padding: 15, marginBottom: 14 },
  scheduledText: { marginLeft: 12, fontSize: 16, color: COLORS.black, fontWeight: '500' },
  paymentContainer: { marginBottom: 14 },
  picker: { backgroundColor: COLORS.lightGray, borderRadius: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-around' },
  paymentOption: { fontSize: 16, color: COLORS.darkGray },
  selectedPayment: { fontSize: 16, color: COLORS.primary, fontWeight: 'bold' },
  periodBadge: { backgroundColor: COLORS.lightGray, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  periodText: { fontSize: 14, fontWeight: '600', color: COLORS.darkGray },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  drawerContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, backgroundColor: COLORS.white, zIndex: 50 },
  drawerHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, marginTop: 20 },
  drawerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  drawerUserName: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  drawerUserEmail: { fontSize: 14, color: COLORS.darkGray },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 16 },
  drawerLabel: { fontSize: 16, fontWeight: '500', color: COLORS.black },
  drawerFooter: { borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingVertical: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '95%', marginTop: 'auto', overflow: 'hidden', flex: 1 },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  filterModalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  closeButton: { padding: 4 },
  filterScrollView: { flex: 1, paddingHorizontal: 25, paddingTop: 20 },
  filterModalFooter: { paddingHorizontal: 25, paddingVertical: 20, borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white },
  filterGroup: { marginBottom: 24 },
  filterLabel: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 12 },
  segmentedControl: { flexDirection: 'row', width: '100%', borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  segmentTextActive: { color: COLORS.white },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterLabelSwitch: { fontSize: 16, fontWeight: '600', color: COLORS.black, flex: 1, marginLeft: 12 },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  filterInput: { backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.black },
});