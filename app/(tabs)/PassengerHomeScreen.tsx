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
    View,
} from 'react-native';

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

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
};

const GOOGLE_MAPS_API_KEY_AQUI = 'AIzaSyBa-CJ6VtvTD11UVHcP7WN1g7CbqZm4j9o';

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

// Marcador de destino menor e com "rabo" para parecer preso no fim da linha
const DestinationMarker = () => (
  <View style={styles.destinationMarkerContainer}>
    <View style={styles.destinationMarkerPin} />
    <View style={styles.destinationMarkerTail} />
  </View>
);

export default function PassengerHomeScreen() {
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [origin, setOrigin] =
    useState<Location.LocationObjectCoords | null>(null);
  const [originAddress, setOriginAddress] = useState('Sua Localização Atual');
  const [destination, setDestination] =
    useState<Location.LocationObjectCoords | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');

  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>(
    []
  );

  const [activeField, setActiveField] = useState<
    'origin' | 'destination' | null
  >(null);

  // Estados para informações da rota
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    price: string;
  } | null>(null);

  const [viewState, setViewState] = useState<'idle' | 'selecting' | 'confirmed'>(
    'idle'
  );
  const [isLoading, setIsLoading] = useState(false);

  const mapRef = useRef<MapView>(null);
  const originInputRef = useRef<TextInput>(null);
  const destinationInputRef = useRef<TextInput>(null);
  const panelAnimation = useRef(new Animated.Value(0)).current;

  // Animar painel ao entrar/sair do modo selecting/confirmed
  useEffect(() => {
    if (viewState === 'selecting' || viewState === 'confirmed') {
      Animated.spring(panelAnimation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 9,
        tension: 60,
      }).start();
    } else {
      Animated.timing(panelAnimation, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [viewState, panelAnimation]);

  // Pedir permissão de localização
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua permissão de localização.'
        );
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = location.coords;
        setUserLocation(coords);
        setOrigin(coords);

        mapRef.current?.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível obter sua localização.');
      }
    })();
  }, []);

  const resetAddressFields = () => {
    setOriginAddress('Sua Localização Atual');
    setDestinationAddress('');
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setDestination(null);
    setOrigin(userLocation);
    setActiveField(null);
    setRouteInfo(null);
  };

  const geocodeAddress = async (
    address: string
  ): Promise<Location.LocationObjectCoords | null> => {
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
        latitude: location.lat,
        longitude: location.lng,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      };
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Erro de Geocodificação',
        `Não foi possível encontrar: ${address}`
      );
      return null;
    }
  };

  const fetchAutocomplete = async (text: string, field: 'origin' | 'destination') => {
    if (text.length < 3) {
      if (field === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_MAPS_API_KEY_AQUI}&language=pt_BR`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        if (field === 'origin') {
          setOriginSuggestions(data.predictions);
        } else {
          setDestinationSuggestions(data.predictions);
        }
      } else {
        if (field === 'origin') {
          setOriginSuggestions([]);
        } else {
          setDestinationSuggestions([]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Calcular preço baseado na distância
  const calculatePrice = (distanceInKm: number): string => {
    const basePrice = 10; // R$ 10 base
    const pricePerKm = 3.5; // R$ 3,50 por km
    const total = basePrice + distanceInKm * pricePerKm;
    return `R$ ${total.toFixed(2)}`;
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

      // Muda para o estado confirmado (aguarda o cálculo da rota)
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
      setActiveField(null);
    } else {
      setDestinationAddress(suggestion.description);
      setDestinationSuggestions([]);
      setActiveField(null);
    }
  };

  // Solicitar motorista
  const handleRequestDriver = () => {
    Alert.alert(
      'Solicitar Motorista',
      'Deseja confirmar a solicitação de um motorista?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            console.log('Solicitando motorista...');
            // lógica aqui
          },
        },
      ]
    );
  };

  const handleStartRide = () => {
    Alert.alert('Iniciar Corrida', 'Deseja iniciar a corrida agora?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Iniciar',
        onPress: () => {
          console.log('Corrida iniciada');
          // aqui você pode alterar o estado para "em viagem" e navegar para outra tela
        },
      },
    ]);
  };

  const handleMenuPress = () => console.log('Abrir menu...');
  const handleProfilePress = () => console.log('Abrir perfil...');

  // --- RENDERIZAÇÃO DOS PAINÉIS ---

  const renderIdlePanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Olá, Passageiro!</Text>
      <Text style={styles.panelSubtitle}>Onde seu carro precisa ir?</Text>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => setViewState('selecting')}
        activeOpacity={0.7}>
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

  const selectingTranslateY = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [450, 0], // anima do fundo para cima
  });

  const renderSelectingPanel = () => (
    <Animated.View
      style={[
        styles.bottomPanelSelecting,
        { transform: [{ translateY: selectingTranslateY }] },
      ]}>
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

      {/* CAMPO DE ORIGEM */}
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
        />

        {/* Lista de Sugestões de ORIGEM */}
        {activeField === 'origin' && originSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}>
              {originSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.place_id}
                  style={styles.suggestionItem}
                  onPress={() => onSuggestionPress(item, 'origin')}>
                  <MapPin color={COLORS.primary} size={18} />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* CAMPO DE DESTINO */}
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
        />

        {/* Lista de Sugestões de DESTINO */}
        {activeField === 'destination' && destinationSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}>
              {destinationSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.place_id}
                  style={styles.suggestionItem}
                  onPress={() => onSuggestionPress(item, 'destination')}>
                  <MapPin color={COLORS.primary} size={18} />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmTrajeto}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Trajeto</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // Painel após confirmar o trajeto (opções para iniciar/cancelar)
  const confirmedTranslateY = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [450, 0],
  });

  const renderConfirmedPanel = () => (
    <Animated.View
      style={[
        styles.bottomPanel,
        { transform: [{ translateY: confirmedTranslateY }] },
      ]}>
      <View style={styles.routeInfoHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setViewState('selecting');
            setDestination(null);
            setRouteInfo(null);
          }}>
          <ArrowLeft color={COLORS.black} size={24} />
        </TouchableOpacity>
        <Text style={styles.panelTitle}>Detalhes da Viagem</Text>
      </View>

      {/* Informações da Rota */}
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

      {/* Endereços */}
      <View style={styles.addressesContainer}>
        <View style={styles.addressItem}>
          <View style={styles.originDot} />
          <Text style={styles.addressText} numberOfLines={1}>
            {originAddress}
          </Text>
        </View>
        <View style={styles.addressDivider} />
        <View style={styles.addressItem}>
          <MapPin color={COLORS.primary} size={20} />
          <Text style={styles.addressText} numberOfLines={1}>
            {destinationAddress}
          </Text>
        </View>
      </View>

      {/* Botões: Iniciar / Cancelar */}
      <View style={styles.confirmActions}>
        <TouchableOpacity
          style={styles.requestDriverButton}
          onPress={handleStartRide}
          activeOpacity={0.8}>
          <Car color={COLORS.white} size={20} />
          <Text style={styles.requestDriverButtonText}>Iniciar Corrida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setViewState('selecting');
            setDestination(null);
            setRouteInfo(null);
          }}
          activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
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
          latitude: -23.55052,
          longitude: -46.633308,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        {/* Marcador do Usuário */}
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarker}>
              <View style={styles.userMarkerCore} />
            </View>
          </Marker>
        )}

        {/* Marcador de Destino - Menor e mais clean, com "rabo" */}
        {destination && (
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 1.0 }}>
            <DestinationMarker />
          </Marker>
        )}

        {/* Rota */}
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY_AQUI}
            strokeWidth={4}
            strokeColor={COLORS.primary}
            onReady={(result) => {
              // Calcula informações da rota
              const distanceInKm = result.distance;
              const durationInMin = Math.ceil(result.duration);

              setRouteInfo({
                distance: `${distanceInKm.toFixed(1)} km`,
                duration: `${durationInMin} min`,
                price: calculatePrice(distanceInKm),
              });

              // Ajusta câmera para abranger a rota, com bottom padding suficiente
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  top: 150,
                  right: 50,
                  bottom: 420, // aumenta para abrir espaço ao painel
                  left: 50,
                },
                animated: true,
              });
            }}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
          <Menu color={COLORS.black} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilotaí</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
          <User color={COLORS.black} size={28} />
        </TouchableOpacity>
      </View>

      {/* Renderiza o painel apropriado */}
      {viewState === 'idle' && renderIdlePanel()}
      {viewState === 'selecting' && renderSelectingPanel()}
      {viewState === 'confirmed' && renderConfirmedPanel()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  iconButton: {
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 20,
  },
  // Painel de seleção com animação (não rolável internamente)
  bottomPanelSelecting: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    maxHeight: '65%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    zIndex: 30,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
  },
  panelSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 20,
    marginTop: 5,
    textAlign: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 25,
  },
  searchButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginLeft: 15,
  },
  shortcutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shortcutButton: {
    alignItems: 'center',
    flex: 1,
  },
  shortcutIconContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  userMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(110, 23, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  // Marcador de destino menor e mais simples com "rabo"
  destinationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  destinationMarkerPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
  },
  destinationMarkerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    marginTop: -1,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 18,
    position: 'relative', // importante para as sugestões absolutas
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 18, // aumentado para ficar mais alto (mais visibilidade)
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
    minHeight: 56,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Ajuste: sugestões agora aparecem em absolute e com zIndex para ficar sobre o painel
  suggestionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 68, // de acordo com a altura do input (paddingVertical + label)
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderColor: COLORS.mediumGray,
    borderWidth: 1,
    maxHeight: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 40,
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.black,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  // Estilos para o painel confirmado
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  routeInfoContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 15,
    marginBottom: 14,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  routeInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  routeInfoLabel: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  routeInfoValue: {
    fontSize: 18,
    color: COLORS.black,
    fontWeight: 'bold',
    marginTop: 2,
  },
  addressesContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 12,
    marginBottom: 14,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  addressText: {
    fontSize: 15,
    color: COLORS.black,
    flex: 1,
    fontWeight: '500',
  },
  addressDivider: {
    height: 1,
    backgroundColor: COLORS.mediumGray,
    marginVertical: 8,
  },
  requestDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  requestDriverButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    marginLeft: 12,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontSize: 16,
    fontWeight: '700',
  },
});
