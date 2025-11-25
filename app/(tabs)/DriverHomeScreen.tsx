import * as Location from 'expo-location';
import {
  Car,
  Check,
  Clock,
  DollarSign,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  User,
  X,
  ArrowRight,
  Filter,
  History,
  Settings,
  LifeBuoy,
  MicOff,
  CreditCard,
  Star,
  Flag,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Switch,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
// Certifique-se de ter rodado: npm install react-native-maps-directions
import MapViewDirections from 'react-native-maps-directions'; 
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#C9C3C3',
  darkGray: '#909090',
  black: '#141414',
  primary: '#6E17EB',
  lightPurple: '#A065F5',
  success: '#34A853',
  danger: '#EA4335',
  warning: '#FBBC05',
};

// CONFIGURAÇÃO
// A CORREÇÃO ESTÁ AQUI: Adicionamos '|| ""' para garantir que seja sempre uma string
const GOOGLE_MAPS_API_KEY_AQUI = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// LOCALIZAÇÃO: BRASÍLIA (Rodoviária do Plano Piloto como referência central)
const FALLBACK_LOCATION: Location.LocationObjectCoords = {
  latitude: -15.794229,
  longitude: -47.882166,
  altitude: 1172,
  accuracy: 1,
  altitudeAccuracy: 1,
  heading: 0,
  speed: 0,
};

const screenWidth = Dimensions.get('window').width;
const DRAWER_WIDTH = screenWidth * 0.8;

// FUNÇÕES UTILITÁRIAS
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
  if ((currentHour >= 7 && currentHour < 9) || (currentHour >= 17 && currentHour < 20)) return 'Horário de Rush (+20%)';
  if (currentHour >= 20 || currentHour < 6) return 'Noturno (+40%)';
  return 'Diurno';
};

// DADOS MOCKADOS (Endereços de Brasília)
const MOCK_REQUESTS = [
  {
    id: 'req1',
    passengerName: 'Ana Silva',
    pickupAddress: 'SQN 208 Bloco A - Asa Norte',
    destinationAddress: 'ParkShopping - Guará',
    distanceToPickup: 1.2,
    tripDistance: 12.5,
    estimatedDuration: 20,
    // Coordenadas Asa Norte
    pickupCoords: { latitude: -15.776735, longitude: -47.878566 },
    // Coordenadas ParkShopping
    destinationCoords: { latitude: -15.835489, longitude: -47.954752 },
  },
  {
    id: 'req2',
    passengerName: 'Carlos Souza',
    pickupAddress: 'Aeroporto Internacional de Brasília',
    destinationAddress: 'Setor Hoteleiro Norte',
    distanceToPickup: 3.5,
    tripDistance: 15.2,
    estimatedDuration: 25,
    // Coordenadas Aeroporto
    pickupCoords: { latitude: -15.869752, longitude: -47.917227 },
    // Coordenadas SHN
    destinationCoords: { latitude: -15.789173, longitude: -47.887856 },
  },
];

type AvailabilityStatus = 'available' | 'unavailable' | 'on_ride';
type RideStage = 'going_to_pickup' | 'arrived_at_pickup' | 'in_progress' | 'arrived_at_destination';

// COMPONENTES VISUAIS
const RideRequestCard = ({ request, onAccept, onDecline }: { request: any; onAccept: () => void; onDecline: () => void; }) => {
  const price = calculateDynamicPrice(request.tripDistance);
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.passengerInfo}>
          <User color={COLORS.primary} size={20} />
          <Text style={styles.passengerName}>{request.passengerName}</Text>
        </View>
        <View style={styles.priceTag}>
          <DollarSign color={COLORS.success} size={18} />
          <Text style={styles.priceText}>{price}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.rideInfoSection}>
        <View style={styles.addressRow}>
          <View style={styles.originDot} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Origem</Text>
            <Text style={styles.addressText} numberOfLines={1}>{request.pickupAddress}</Text>
          </View>
        </View>
        <View style={styles.connectorLine} />
        <View style={styles.addressRow}>
          <MapPin color={COLORS.primary} size={20} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Destino</Text>
            <Text style={styles.addressText} numberOfLines={1}>{request.destinationAddress}</Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Navigation color={COLORS.darkGray} size={16} />
          <View style={styles.metricContent}>
            <Text style={styles.metricLabel}>Até você</Text>
            <Text style={styles.metricValue}>{request.distanceToPickup.toFixed(1)} km</Text>
          </View>
        </View>
        <View style={styles.metricItem}>
          <ArrowRight color={COLORS.darkGray} size={16} />
          <View style={styles.metricContent}>
            <Text style={styles.metricLabel}>Viagem</Text>
            <Text style={styles.metricValue}>{request.tripDistance.toFixed(1)} km</Text>
          </View>
        </View>
        <View style={styles.metricItem}>
          <Clock color={COLORS.darkGray} size={16} />
          <View style={styles.metricContent}>
            <Text style={styles.metricLabel}>Duração</Text>
            <Text style={styles.metricValue}>{request.estimatedDuration} min</Text>
          </View>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={[styles.requestButton, styles.declineButton]} onPress={onDecline}>
          <X size={20} color={COLORS.danger} />
          <Text style={[styles.requestButtonText, styles.declineButtonText]}>Recusar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.requestButton, styles.acceptButton]} onPress={onAccept}>
          <Check size={20} color={COLORS.white} />
          <Text style={[styles.requestButtonText, styles.acceptButtonText]}>Aceitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =================================================================
// === TELA PRINCIPAL DO MOTORISTA =================================
// =================================================================
export default function DriverHomeScreen() {
  const navigation = useNavigation<any>();

  const goToProfile = () => {
    closeDrawer();
    navigation.navigate('DriverProfileScreen');
  };

  const [driverLocation, setDriverLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('unavailable');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [currentRide, setCurrentRide] = useState<any | null>(null);
  const [rideStage, setRideStage] = useState<RideStage | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Modal de Avaliação
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [passengerRating, setPassengerRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Drawer
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const drawerOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Filtros
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [passengerGender, setPassengerGender] = useState('any');
  const [minRating, setMinRating] = useState('any');
  const [acceptScheduled, setAcceptScheduled] = useState(true);
  const [paymentPreference, setPaymentPreference] = useState('any');
  const [minDistance, setMinDistance] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [acceptSilent, setAcceptSilent] = useState(true);

  // Filtros Temporários
  const [tempPassengerGender, setTempPassengerGender] = useState(passengerGender);
  const [tempMinRating, setTempMinRating] = useState(minRating);
  const [tempAcceptScheduled, setTempAcceptScheduled] = useState(acceptScheduled);
  const [tempPaymentPreference, setTempPaymentPreference] = useState(paymentPreference);
  const [tempMinDistance, setTempMinDistance] = useState(minDistance);
  const [tempMaxDistance, setTempMaxDistance] = useState(maxDistance);
  const [tempAcceptSilent, setTempAcceptSilent] = useState(acceptSilent);

  const mapRef = useRef<MapView>(null);

  // Localização
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Usando localização padrão.');
        setDriverLocation(FALLBACK_LOCATION);
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => setDriverLocation(loc.coords)
      );
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setDriverLocation(initial.coords);
      
      // Centralizar em Brasília se não tiver pego a localização real ainda ou na localização do user
      const initialRegion = initial.coords ? initial.coords : FALLBACK_LOCATION;

      mapRef.current?.animateToRegion({ ...initialRegion, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 1000);
    })();
    return () => subscription?.remove();
  }, []);

  // Simulação de requests
  useEffect(() => {
    let interval: any;
    if (availabilityStatus === 'available') {
      interval = setInterval(() => setIncomingRequests([...MOCK_REQUESTS]), 5000); // Reduzi tempo pra testar mais rápido
    } else {
      setIncomingRequests([]);
    }
    return () => clearInterval(interval);
  }, [availabilityStatus]);

  // Marcador
  useEffect(() => {
    setTracksViewChanges(true);
    const t = setTimeout(() => setTracksViewChanges(false), 3000);
    return () => clearTimeout(t);
  }, [driverLocation]);

  // Ações
  const handleToggleAvailability = () => {
    if (availabilityStatus === 'on_ride') {
      Alert.alert('Atenção', 'Você está em uma corrida. Finalize-a antes de ficar offline.');
      return;
    }
    setAvailabilityStatus(prev => prev === 'unavailable' ? 'available' : 'unavailable');
    if (currentRide) {
      setCurrentRide(null);
      setRideStage(null);
    }
  };

  const handleAcceptRequest = (req: any) => {
    setCurrentRide(req);
    setAvailabilityStatus('on_ride');
    setRideStage('going_to_pickup');
    setIncomingRequests([]);
    
    // Ajustar zoom para mostrar motorista e pickup
    if (driverLocation && req.pickupCoords) {
      mapRef.current?.fitToCoordinates([
        { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
        req.pickupCoords
      ], {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  };

  const handleDeclineRequest = (id: string) => setIncomingRequests(prev => prev.filter(r => r.id !== id));

  // Ações da Corrida
  const handleArrivedAtPickup = () => {
      setRideStage('arrived_at_pickup');
      // Focar no passageiro
      if(currentRide?.pickupCoords) {
        mapRef.current?.animateToRegion({
            ...currentRide.pickupCoords,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }, 1000);
      }
  };

  const handleStartRide = () => {
      setRideStage('in_progress');
      // Ajustar rota completa (origem -> destino)
      if (currentRide?.pickupCoords && currentRide?.destinationCoords) {
        mapRef.current?.fitToCoordinates([
            currentRide.pickupCoords,
            currentRide.destinationCoords
        ], {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
        });
      }
  };

  const handleArrivedAtDestination = () => setRideStage('arrived_at_destination');
  const handleFinishRide = () => {
    setIsRatingModalVisible(true);
  };

  const handleSubmitRating = () => {
    if (passengerRating === 0) {
      Alert.alert('Avaliação', 'Por favor, dê uma nota ao passageiro.');
      return;
    }
    // Simular envio da avaliação (mock)
    Alert.alert('Avaliação Enviada', `Passageiro avaliado com ${passengerRating} estrelas. Comentário: ${ratingComment}`);
    setIsRatingModalVisible(false);
    setPassengerRating(0);
    setRatingComment('');
    // Resetar para disponível
    setCurrentRide(null);
    setRideStage(null);
    setAvailabilityStatus('available');
    // Voltar mapa para localização atual
    if (driverLocation) {
      mapRef.current?.animateToRegion({ ...driverLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 1000);
    }
  };

  // Drawer Control
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

  // Filtros Control
  const handleOpenFilterModal = () => {
    setTempPassengerGender(passengerGender);
    setTempMinRating(minRating);
    setTempAcceptScheduled(acceptScheduled);
    setTempPaymentPreference(paymentPreference);
    setTempMinDistance(minDistance);
    setTempMaxDistance(maxDistance);
    setTempAcceptSilent(acceptSilent);
    setIsFilterModalVisible(true);
  };

  const handleSaveFilters = () => {
    setPassengerGender(tempPassengerGender);
    setMinRating(tempMinRating);
    setAcceptScheduled(tempAcceptScheduled);
    setPaymentPreference(tempPaymentPreference);
    setMinDistance(tempMinDistance);
    setMaxDistance(tempMaxDistance);
    setAcceptSilent(tempAcceptSilent);
    setIsFilterModalVisible(false);
  };

  // Paineis
  const renderUnavailablePanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Você está Offline</Text>
      <Text style={styles.panelSubtitle}>Fique online para receber solicitações de corridas.</Text>
      <TouchableOpacity style={[styles.actionButton, styles.goAvailableButton]} onPress={handleToggleAvailability}>
        <Car color={COLORS.white} size={22} />
        <Text style={styles.actionButtonText}>Ficar Online</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAvailablePanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Procurando Corridas...</Text>
      <Text style={styles.panelSubtitle}>Aguardando solicitações na sua área.</Text>
      <View style={styles.periodBadge}>
        <Text style={styles.periodText}>{getPeriodLabel()}</Text>
      </View>
      <TouchableOpacity style={[styles.actionButton, styles.goUnavailableButton]} onPress={handleToggleAvailability}>
        <LogOut color={COLORS.white} size={22} />
        <Text style={styles.actionButtonText}>Ficar Offline</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequestPanel = () => (
    <View style={[styles.bottomPanel, styles.requestPanel]}>
      <View style={styles.requestPanelHeader}>
        <Text style={styles.panelTitle}>Novas Solicitações!</Text>
        <View style={styles.periodBadgeSmall}>
          <Text style={styles.periodTextSmall}>{getPeriodLabel()}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.requestScrollContent}>
        {incomingRequests.map(req => (
          <RideRequestCard
            key={req.id}
            request={req}
            onAccept={() => handleAcceptRequest(req)}
            onDecline={() => handleDeclineRequest(req.id)}
          />
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.actionButton, styles.goUnavailableButton, styles.offlineButtonInRequests]} onPress={handleToggleAvailability}>
        <LogOut color={COLORS.white} size={20} />
        <Text style={styles.actionButtonText}>Ficar Offline</Text>
      </TouchableOpacity>
    </View>
  );

  // Novos Painéis para Corrida
  const renderGoingToPickupPanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Indo Buscar Passageiro</Text>
      <Text style={styles.panelSubtitle}>{currentRide?.passengerName}</Text>
      <View style={styles.rideInfoSection}>
        <View style={styles.addressRow}>
          <MapPin color={COLORS.primary} size={20} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Ponto de Embarque</Text>
            <Text style={styles.addressText}>{currentRide?.pickupAddress}</Text>
          </View>
        </View>
      </View>
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Navigation color={COLORS.darkGray} size={16} />
          <View style={styles.metricContent}>
            <Text style={styles.metricLabel}>Distância</Text>
            <Text style={styles.metricValue}>{currentRide?.distanceToPickup.toFixed(1)} km</Text>
          </View>
        </View>
        <View style={styles.metricItem}>
          <Clock color={COLORS.darkGray} size={16} />
          <View style={styles.metricContent}>
            <Text style={styles.metricLabel}>Tempo Estimado</Text>
            <Text style={styles.metricValue}>{currentRide?.estimatedDuration} min</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleArrivedAtPickup}>
        <Check color={COLORS.white} size={22} />
        <Text style={styles.actionButtonText}>Cheguei no Local</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.goUnavailableButton, { marginTop: 10 }]} onPress={handleToggleAvailability}>
        <LogOut color={COLORS.white} size={20} />
        <Text style={styles.actionButtonText}>Cancelar Corrida</Text>
      </TouchableOpacity>
    </View>
  );

  const renderArrivedAtPickupPanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Aguardando Passageiro</Text>
      <Text style={styles.panelSubtitle}>{currentRide?.passengerName}</Text>
      <View style={styles.rideInfoSection}>
        <View style={styles.addressRow}>
          <MapPin color={COLORS.primary} size={20} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Local Atual</Text>
            <Text style={styles.addressText}>{currentRide?.pickupAddress}</Text>
          </View>
        </View>
        <View style={styles.connectorLine} />
        <View style={styles.addressRow}>
          <Flag color={COLORS.warning} size={20} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Destino</Text>
            <Text style={styles.addressText}>{currentRide?.destinationAddress}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleStartRide}>
        <ArrowRight color={COLORS.white} size={22} />
        <Text style={styles.actionButtonText}>Iniciar Viagem</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.goUnavailableButton, { marginTop: 10 }]} onPress={handleToggleAvailability}>
        <LogOut color={COLORS.white} size={20} />
        <Text style={styles.actionButtonText}>Cancelar Corrida</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInProgressPanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Em Rota</Text>
      <Text style={styles.panelSubtitle}>Com {currentRide?.passengerName}</Text>
      <View style={styles.rideInfoSection}>
        <View style={styles.addressRow}>
          <Flag color={COLORS.warning} size={20} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Destino</Text>
            <Text style={styles.addressText}>{currentRide?.destinationAddress}</Text>
          </View>
        </View>
      </View>
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <ArrowRight color={COLORS.darkGray} size={16} />
          <View style={styles.metricContent}>
            <Text style={styles.metricLabel}>Distância Restante</Text>
            <Text style={styles.metricValue}>{currentRide?.tripDistance.toFixed(1)} km</Text>
          </View>
        </View>
        <View style={styles.metricItem}>
          <Clock color={COLORS.darkGray} size={16} />
          <View style={styles.metricContent}>
            <Text style={styles.metricLabel}>Tempo Estimado</Text>
            <Text style={styles.metricValue}>{currentRide?.estimatedDuration} min</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleArrivedAtDestination}>
        <Flag color={COLORS.white} size={22} />
        <Text style={styles.actionButtonText}>Cheguei no Destino</Text>
      </TouchableOpacity>
    </View>
  );

  const renderArrivedAtDestinationPanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Corrida Concluída</Text>
      <Text style={styles.panelSubtitle}>Aguardando confirmação do passageiro.</Text>
      <View style={styles.priceTagLarge}>
        <DollarSign color={COLORS.success} size={24} />
        <Text style={styles.priceTextLarge}>{calculateDynamicPrice(currentRide?.tripDistance || 0)}</Text>
      </View>
      <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleFinishRide}>
        <Check color={COLORS.white} size={22} />
        <Text style={styles.actionButtonText}>Finalizar Corrida</Text>
      </TouchableOpacity>
    </View>
  );

  // --- MODAL DE AVALIAÇÃO CORRIGIDA ---
  const renderRatingModal = () => (
    <Modal visible={isRatingModalVisible} animationType="slide" transparent onRequestClose={() => setIsRatingModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Avaliar Passageiro</Text>
            <TouchableOpacity onPress={() => setIsRatingModalVisible(false)} style={styles.closeButton}>
              <X color={COLORS.black} size={26} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 25, paddingTop: 20 }}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Nota para {currentRide?.passengerName}</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setPassengerRating(star)}>
                     {/* CORREÇÃO DO ERRO DA ESTRELA AQUI */}
                    <Star 
                        color={star <= passengerRating ? COLORS.warning : COLORS.mediumGray} 
                        fill={star <= passengerRating ? COLORS.warning : 'transparent'}
                        size={32} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Comentário (Opcional)</Text>
              <TextInput
                style={styles.filterInput}
                value={ratingComment}
                onChangeText={setRatingComment}
                placeholder="Deixe um comentário sobre o passageiro..."
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
          <View style={styles.filterModalFooter}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmitRating}>
              <Text style={styles.saveButtonText}>Enviar Avaliação</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // --- MODAL DE FILTROS REESTRUTURADA (CLEAN) ---
  const renderFilterModal = () => (
    <Modal visible={isFilterModalVisible} animationType="slide" transparent onRequestClose={() => setIsFilterModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          {/* Header */}
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Preferências</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} style={styles.closeButton}>
              <X color={COLORS.black} size={26} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 25, paddingTop: 20 }}>
            {/* Gênero */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Gênero do Passageiro</Text>
              <View style={styles.segmentedControl}>
                {['any', 'female', 'male'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.segment, tempPassengerGender === opt && styles.segmentActive]}
                    onPress={() => setTempPassengerGender(opt)}
                  >
                    <Text style={[styles.segmentText, tempPassengerGender === opt && styles.segmentTextActive]}>
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
                    style={[styles.segment, tempMinRating === opt && styles.segmentActive]}
                    onPress={() => setTempMinRating(opt)}
                  >
                    <Text style={[styles.segmentText, tempMinRating === opt && styles.segmentTextActive]}>
                      {opt === 'any' ? 'Qualquer' : opt + '+'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Forma de Pagamento */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Pagamento Aceito</Text>
              <View style={styles.segmentedControl}>
                {['any', 'cartao', 'dinheiro', 'pix'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.segment, tempPaymentPreference === opt && styles.segmentActive]}
                    onPress={() => setTempPaymentPreference(opt)}
                  >
                    <Text style={[styles.segmentText, tempPaymentPreference === opt && styles.segmentTextActive]}>
                      {opt === 'any' ? 'Todos' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distâncias (Lado a Lado para ficar Clean) */}
            <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Distância da Corrida (km)</Text>
                <View style={styles.doubleInputRow}>
                    <View style={styles.halfInputContainer}>
                        <Text style={styles.subLabel}>Mínima</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={tempMinDistance}
                            onChangeText={setTempMinDistance}
                            placeholder="0"
                            placeholderTextColor={COLORS.mediumGray}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.halfInputContainer}>
                        <Text style={styles.subLabel}>Máxima</Text>
                        <TextInput
                            style={styles.filterInput}
                            value={tempMaxDistance}
                            onChangeText={setTempMaxDistance}
                            placeholder="100"
                            placeholderTextColor={COLORS.mediumGray}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            </View>

            {/* Switches */}
            <View style={styles.filterGroup}>
              <View style={styles.switchRow}>
                <Clock color={COLORS.black} size={22} />
                <Text style={styles.filterLabelSwitch}>Aceitar Agendadas</Text>
                <Switch value={tempAcceptScheduled} onValueChange={setTempAcceptScheduled} trackColor={{ false: COLORS.mediumGray, true: COLORS.primary }} />
              </View>
            </View>

            <View style={styles.filterGroup}>
              <View style={styles.switchRow}>
                <MicOff color={COLORS.black} size={22} />
                <Text style={styles.filterLabelSwitch}>Aceitar Silenciosos</Text>
                <Switch value={tempAcceptSilent} onValueChange={setTempAcceptSilent} trackColor={{ false: COLORS.mediumGray, true: COLORS.primary }} />
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterModalFooter}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveFilters}>
              <Text style={styles.saveButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // --- MENU LATERAL ---
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
              <Text style={styles.drawerUserName}>Olá, Motorista!</Text>
              <Text style={styles.drawerUserEmail}>motorista@email.com</Text>
            </View>
          </View>
          <ScrollView>
            <TouchableOpacity style={styles.drawerItem} onPress={goToProfile}>
              <User color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Meu Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={goToProfile}>
              <Car color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Meu Veículo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={goToProfile}>
              <DollarSign color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Ganhos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={goToProfile}>
              <History color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Histórico de Corridas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={goToProfile}>
              <Settings color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Configurações</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={goToProfile}>
              <LifeBuoy color={COLORS.primary} size={22} /><Text style={styles.drawerLabel}>Ajuda e Suporte</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); Alert.alert('Sair', 'Tem certeza?', [{ text: 'Sim', onPress: () => navigation.replace('Login') }]); }}>
              <LogOut color={COLORS.danger} size={22} /><Text style={[styles.drawerLabel, { color: COLORS.danger }]}>Sair</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );

  // Status do Header baseado no estágio
  const getHeaderStatus = () => {
    if (availabilityStatus === 'unavailable') return 'Offline';
    if (availabilityStatus === 'available') return 'Online';
    if (rideStage === 'going_to_pickup') return 'Indo Buscar';
    if (rideStage === 'arrived_at_pickup') return 'Aguardando Passageiro';
    if (rideStage === 'in_progress') return 'Em Rota';
    if (rideStage === 'arrived_at_destination') return 'Corrida Concluída';
    return 'Em Corrida';
  };

  const headerStatusStyle = () => {
    if (availabilityStatus === 'unavailable') return styles.headerBadgeOffline;
    if (availabilityStatus === 'available') return styles.headerBadgeOnline;
    return styles.headerBadgeOnRide;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <MapView ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE} showsUserLocation={false} showsMyLocationButton={false}>
        {driverLocation && (
          <Marker coordinate={driverLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={tracksViewChanges}>
            <View style={styles.userMarker}><View style={styles.userMarkerCore} /></View>
          </Marker>
        )}
        {currentRide && (
          <>
            <Marker coordinate={currentRide.pickupCoords} title="Ponto de Embarque">
              <View style={styles.pickupMarker}><MapPin color={COLORS.success} size={24} /></View>
            </Marker>
            <Marker coordinate={currentRide.destinationCoords} title="Destino">
              <View style={styles.destinationMarker}><Flag color={COLORS.warning} size={24} /></View>
            </Marker>

            {/* === ROTA IGUAL UBER (TRAÇADO) === */}
            {/* Se estiver indo buscar: rota do motorista até o passageiro */}
            {rideStage === 'going_to_pickup' && driverLocation && (
                <MapViewDirections
                    origin={driverLocation}
                    destination={currentRide.pickupCoords}
                    apikey={GOOGLE_MAPS_API_KEY_AQUI}
                    strokeWidth={4}
                    strokeColor={COLORS.primary}
                    optimizeWaypoints={true}
                    onError={(errorMessage) => {
                        console.log('Erro na rota:', errorMessage);
                    }}
                />
            )}
            
            {/* Se a corrida começou: rota do passageiro até o destino */}
            {(rideStage === 'in_progress' || rideStage === 'arrived_at_destination') && (
                 <MapViewDirections
                    origin={currentRide.pickupCoords}
                    destination={currentRide.destinationCoords}
                    apikey={GOOGLE_MAPS_API_KEY_AQUI}
                    strokeWidth={4}
                    strokeColor={COLORS.primary}
                    optimizeWaypoints={true}
                 />
            )}

            {/* Fallback visual: Linha simples caso a API Key não esteja configurada ainda, para você ver algo na tela */}
            {!GOOGLE_MAPS_API_KEY_AQUI && rideStage === 'in_progress' && (
                 <Polyline 
                    coordinates={[currentRide.pickupCoords, currentRide.destinationCoords]}
                    strokeColor={COLORS.primary}
                    strokeWidth={4}
                    lineDashPattern={[1]}
                 />
            )}
          </>
        )}
      </MapView>

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={openDrawer}><Menu color={COLORS.black} size={28} /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerStatusText, headerStatusStyle()]}>
            {getHeaderStatus()}
          </Text>
        </View>
        <View style={styles.headerRightColumn}>
          <TouchableOpacity style={styles.iconButton} onPress={goToProfile}><User color={COLORS.black} size={28} /></TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.filterButton]} onPress={handleOpenFilterModal}><Filter color={COLORS.black} size={24} /></TouchableOpacity>
        </View>
      </View>

      {availabilityStatus === 'unavailable' && renderUnavailablePanel()}
      {availabilityStatus === 'available' && incomingRequests.length === 0 && renderAvailablePanel()}
      {availabilityStatus === 'available' && incomingRequests.length > 0 && renderRequestPanel()}
      {availabilityStatus === 'on_ride' && rideStage === 'going_to_pickup' && renderGoingToPickupPanel()}
      {availabilityStatus === 'on_ride' && rideStage === 'arrived_at_pickup' && renderArrivedAtPickupPanel()}
      {availabilityStatus === 'on_ride' && rideStage === 'in_progress' && renderInProgressPanel()}
      {availabilityStatus === 'on_ride' && rideStage === 'arrived_at_destination' && renderArrivedAtDestinationPanel()}

      {renderSideMenu()}
      {renderFilterModal()}
      {renderRatingModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  map: { ...StyleSheet.absoluteFillObject },
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
  headerCenter: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  headerStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    textAlign: 'center',
  },
  headerBadgeOnline: { backgroundColor: COLORS.success },
  headerBadgeOffline: { backgroundColor: COLORS.danger },
  headerBadgeOnRide: { backgroundColor: COLORS.warning, color: COLORS.black },
  headerRightColumn: { flexDirection: 'column', alignItems: 'center', gap: 12 },
  filterButton: { padding: 6, borderRadius: 20 },
  userMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(110, 23, 235, 0.2)', justifyContent: 'center', alignItems: 'center' },
  userMarkerCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white },
  pickupMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.success + '20', justifyContent: 'center', alignItems: 'center' },
  destinationMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.warning + '20', justifyContent: 'center', alignItems: 'center' },
  
  // Painel Inferior
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: 'center',
    minHeight: 200,
  },
  requestPanel: { maxHeight: '70%', alignItems: 'stretch' },
  panelTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, marginBottom: 8, textAlign: 'center' },
  panelSubtitle: { fontSize: 16, color: COLORS.darkGray, marginBottom: 20, textAlign: 'center' },
  periodBadge: { backgroundColor: COLORS.lightGray, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  periodText: { fontSize: 14, fontWeight: '600', color: COLORS.darkGray },
  periodBadgeSmall: { backgroundColor: COLORS.lightPurple, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  periodTextSmall: { fontSize: 12, fontWeight: '600', color: COLORS.white },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 15, paddingVertical: 16, paddingHorizontal: 30, marginTop: 10, width: '90%', elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  goAvailableButton: { backgroundColor: COLORS.success, shadowColor: COLORS.success },
  goUnavailableButton: { backgroundColor: COLORS.danger, shadowColor: COLORS.danger },
  primaryButton: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary },
  offlineButtonInRequests: { marginTop: 15 },
  requestScrollContent: { paddingBottom: 10 },
  requestPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, width: '100%' },
  
  // Card de Solicitação
  requestCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, borderWidth: 1, borderColor: COLORS.lightGray },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  passengerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerName: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  priceTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
  priceText: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
  priceTagLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '10', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, gap: 8, marginBottom: 20, justifyContent: 'center', width: '100%' },
  priceTextLarge: { fontSize: 24, fontWeight: 'bold', color: COLORS.success },
  divider: { height: 1, backgroundColor: COLORS.mediumGray, marginVertical: 15 },
  rideInfoSection: { marginBottom: 5 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  originDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, marginTop: 4 },
  addressContent: { flex: 1 },
  addressLabel: { fontSize: 12, fontWeight: '600', color: COLORS.darkGray, textTransform: 'uppercase', marginBottom: 4 },
  addressText: { fontSize: 15, color: COLORS.black, fontWeight: '500', lineHeight: 20 },
  connectorLine: { width: 2, height: 20, backgroundColor: COLORS.mediumGray, marginLeft: 5, marginVertical: 5 },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  metricItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.lightGray, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 10, marginHorizontal: 3 },
  metricContent: { flex: 1 },
  metricLabel: { fontSize: 11, color: COLORS.darkGray, fontWeight: '500', marginBottom: 2 },
  metricValue: { fontSize: 14, color: COLORS.black, fontWeight: 'bold' },
  requestActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 10 },
  requestButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, elevation: 2 },
  requestButtonText: { fontSize: 15, fontWeight: 'bold', marginLeft: 8 },
  acceptButton: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary },
  acceptButtonText: { color: COLORS.white },
  declineButton: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.danger },
  declineButtonText: { color: COLORS.danger },

  // Drawer
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  drawerContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, backgroundColor: COLORS.white, zIndex: 50 },
  drawerHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, marginTop: 20 },
  drawerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  drawerUserName: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  drawerUserEmail: { fontSize: 14, color: COLORS.darkGray },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 16 },
  drawerLabel: { fontSize: 16, fontWeight: '500', color: COLORS.black },
  drawerFooter: { borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingVertical: 10 },

  // Modal de Filtros e Avaliação (Clean Style)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  filterModalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '95%', marginTop: 'auto', overflow: 'hidden', flex: 1 },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  filterModalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  closeButton: { padding: 4 },
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
  
  // Estilos específicos para Inputs de Distância e Rating
  doubleInputRow: { flexDirection: 'row', gap: 15 },
  halfInputContainer: { flex: 1 },
  subLabel: { fontSize: 12, color: COLORS.darkGray, marginBottom: 6, fontWeight: '500' },
  filterInput: { backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.black },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 },
});