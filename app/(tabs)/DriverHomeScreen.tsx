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
  AlertTriangle,
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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

// Cores do projeto
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

const GOOGLE_MAPS_API_KEY_AQUI = 'AIzaSyBa-CJ6VtvTD11UVHcP7WN1g7CbqZm4j9o';

const FALLBACK_LOCATION: Location.LocationObjectCoords = {
  latitude: -23.55052,
  longitude: -46.633308,
  altitude: 0,
  accuracy: 1,
  altitudeAccuracy: 1,
  heading: 0,
  speed: 0,
};

// Motivos de cancelamento
const CANCEL_REASONS = [
  'Passageiro não compareceu',
  'Passageiro solicitou cancelamento',
  'Problema com o veículo',
  'Endereço incorreto',
  'Motivo pessoal',
  'Outro motivo',
];

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

// MOCK DATA
const MOCK_REQUESTS = [
  {
    id: 'req1',
    passengerName: 'Ana Silva',
    pickupAddress: 'Rua Augusta, 500 - Consolação',
    destinationAddress: 'Av. Paulista, 1500 - Bela Vista',
    distanceToPickup: 1.2,
    tripDistance: 3.5,
    estimatedDuration: 15,
    pickupCoords: { latitude: -23.555, longitude: -46.645 },
    destinationCoords: { latitude: -23.561, longitude: -46.656 },
  },
  {
    id: 'req2',
    passengerName: 'Carlos Souza',
    pickupAddress: 'Rua Oscar Freire, 200 - Jardins',
    destinationAddress: 'Parque Ibirapuera - Vila Mariana',
    distanceToPickup: 3.5,
    tripDistance: 7.8,
    estimatedDuration: 25,
    pickupCoords: { latitude: -23.558, longitude: -46.669 },
    destinationCoords: { latitude: -23.588, longitude: -46.658 },
  },
];

type AvailabilityStatus = 'available' | 'unavailable' | 'on_ride';
type RideStage = 'going_to_pickup' | 'arrived_at_pickup' | 'in_progress' | 'arrived_at_destination';

// Marcador de destino menor
const DestinationMarker = () => (
  <View style={styles.destinationMarkerContainer}>
    <View style={styles.destinationMarkerPin} />
  </View>
);

// Componente de cartão de corrida
const RideRequestCard = ({
  request,
  onAccept,
  onDecline,
}: {
  request: any;
  onAccept: () => void;
  onDecline: () => void;
}) => {
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
            <Text style={styles.addressText} numberOfLines={1}>
              {request.pickupAddress}
            </Text>
          </View>
        </View>

        <View style={styles.connectorLine} />

        <View style={styles.addressRow}>
          <MapPin color={COLORS.primary} size={20} />
          <View style={styles.addressContent}>
            <Text style={styles.addressLabel}>Destino</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {request.destinationAddress}
            </Text>
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
        <TouchableOpacity
          style={[styles.requestButton, styles.declineButton]}
          onPress={onDecline}
          activeOpacity={0.7}
        >
          <X size={20} color={COLORS.danger} />
          <Text style={[styles.requestButtonText, styles.declineButtonText]}>Recusar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.requestButton, styles.acceptButton]}
          onPress={onAccept}
          activeOpacity={0.7}
        >
          <Check size={20} color={COLORS.white} />
          <Text style={[styles.requestButtonText, styles.acceptButtonText]}>Aceitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function DriverHomeScreen() {
  const [driverLocation, setDriverLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('unavailable');
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [currentRide, setCurrentRide] = useState<any | null>(null);
  const [rideStage, setRideStage] = useState<RideStage | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cameraHeading, setCameraHeading] = useState(0);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Usando localização padrão.');
        setDriverLocation(FALLBACK_LOCATION);
        return;
      }
      try {
        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (location) => {
            setDriverLocation(location.coords);
          }
        );
        let initialLocation = await Location.getLastKnownPositionAsync() ??
          await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (initialLocation) {
          setDriverLocation(initialLocation.coords);
          mapRef.current?.animateToRegion(
            {
              ...initialLocation.coords,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            },
            1000
          );
        } else throw new Error('Localização inicial falhou');
      } catch (error) {
        console.error('Erro Loc:', error);
        Alert.alert('Erro', 'Usando localização padrão.');
        setDriverLocation(FALLBACK_LOCATION);
      }
    })();
    return () => {
      locationSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (availabilityStatus === 'available') {
      intervalId = setInterval(() => {
        setIncomingRequests(MOCK_REQUESTS);
      }, 10000);
    } else {
      setIncomingRequests([]);
      if (intervalId) clearInterval(intervalId);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [availabilityStatus]);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 3000);
    return () => clearTimeout(timer);
  }, [driverLocation]);

  const updateCameraHeading = async () => {
    try {
      const camera = await mapRef.current?.getCamera();
      if (camera) {
        setCameraHeading(camera.heading);
      }
    } catch (error) {
      console.error('Error getting camera:', error);
    }
  };

  const handleToggleAvailability = () => {
    const newStatus = availabilityStatus === 'unavailable' ? 'available' : 'unavailable';
    setAvailabilityStatus(newStatus);
    if (newStatus === 'unavailable') {
      setIncomingRequests([]);
    }
  };

  const handleAcceptRequest = (request: any) => {
    setCurrentRide(request);
    setAvailabilityStatus('on_ride');
    setRideStage('going_to_pickup');
    setIncomingRequests([]);
  };

  const handleDeclineRequest = (requestId: string) => {
    setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  const handleArrivedAtPickup = () => setRideStage('arrived_at_pickup');
  const handleStartRide = () => setRideStage('in_progress');
  const handleArrivedAtDestination = () => setRideStage('arrived_at_destination');

  const handleEndRide = () => {
    Alert.alert('Finalizar Corrida', 'Deseja realmente finalizar esta corrida?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: () => {
          setCurrentRide(null);
          setRideStage(null);
          setAvailabilityStatus('available');
        },
      },
    ]);
  };

  const handleCancelRide = (reason: string) => {
    setShowCancelModal(false);
    setCurrentRide(null);
    setRideStage(null);
    setAvailabilityStatus('available');
    Alert.alert('Corrida Cancelada', `Motivo: ${reason}`);
  };

  const handleMenuPress = () => console.log('Abrir menu...');
  const handleProfilePress = () => console.log('Abrir perfil/ganhos...');

  // --- RENDERIZAÇÃO DOS PAINÉIS ---

  const renderUnavailablePanel = () => (
    <View style={styles.bottomPanel}>
      <Text style={styles.panelTitle}>Você está Offline</Text>
      <Text style={styles.panelSubtitle}>Fique online para receber solicitações de corridas.</Text>
      <TouchableOpacity
        style={[styles.actionButton, styles.goAvailableButton]}
        onPress={handleToggleAvailability}
        activeOpacity={0.8}
      >
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
      <TouchableOpacity
        style={[styles.actionButton, styles.goUnavailableButton]}
        onPress={handleToggleAvailability}
        activeOpacity={0.8}
      >
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

      <ScrollView
        horizontal={false}
        contentContainerStyle={styles.requestScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {incomingRequests.map((request) => (
          <RideRequestCard
            key={request.id}
            request={request}
            onAccept={() => handleAcceptRequest(request)}
            onDecline={() => handleDeclineRequest(request.id)}
          />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.actionButton, styles.goUnavailableButton, styles.offlineButtonInRequests]}
        onPress={handleToggleAvailability}
        activeOpacity={0.8}
      >
        <LogOut color={COLORS.white} size={20} />
        <Text style={styles.actionButtonText}>Ficar Offline</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOnRidePanel = () => {
    if (!currentRide) return null;

    return (
      <View style={styles.bottomPanel}>
        {rideStage === 'going_to_pickup' && (
          <>
            <Text style={styles.panelTitle}>Indo buscar o Passageiro</Text>
            <Text style={styles.panelSubtitleBold}>{currentRide.passengerName}</Text>

            <View style={styles.addressItem}>
              <View style={styles.originDot} />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Local de Embarque</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {currentRide.pickupAddress}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.actionButton, styles.navigateButton]}>
              <Navigation color={COLORS.white} size={20} />
              <Text style={styles.actionButtonText}>Navegar até Embarque</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionButton, styles.secondaryActionButtonElevated]}
              onPress={handleArrivedAtPickup}
            >
              <Check color={COLORS.primary} size={20} />
              <Text style={styles.secondaryActionButtonText}>Cheguei ao Local</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelButton]} onPress={() => setShowCancelModal(true)}>
              <X color={COLORS.danger} size={18} />
              <Text style={styles.cancelButtonText}>Cancelar Corrida</Text>
            </TouchableOpacity>
          </>
        )}

        {rideStage === 'arrived_at_pickup' && (
          <>
            <Text style={styles.panelTitle}>Aguardando Embarque</Text>
            <Text style={styles.panelSubtitleBold}>{currentRide.passengerName}</Text>

            <View style={styles.waitingContainer}>
              <Clock color={COLORS.warning} size={40} />
              <Text style={styles.waitingText}>Aguardando o passageiro entrar no veículo</Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.startRideButton]}
              onPress={handleStartRide}
            >
              <Navigation color={COLORS.white} size={20} />
              <Text style={styles.actionButtonText}>Iniciar Corrida</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelButton]} onPress={() => setShowCancelModal(true)}>
              <X color={COLORS.danger} size={18} />
              <Text style={styles.cancelButtonText}>Cancelar Corrida</Text>
            </TouchableOpacity>
          </>
        )}

        {rideStage === 'in_progress' && (
          <>
            <Text style={styles.panelTitle}>Em Viagem</Text>
            <Text style={styles.panelSubtitleBold}>{currentRide.passengerName}</Text>

            <View style={styles.addressItem}>
              <MapPin color={COLORS.primary} size={20} />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Destino</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {currentRide.destinationAddress}
                </Text>
              </View>
            </View>

            <View style={styles.tripInfoBox}>
              <View style={styles.tripInfoItem}>
                <ArrowRight color={COLORS.darkGray} size={18} />
                <Text style={styles.tripInfoText}>{currentRide.tripDistance.toFixed(1)} km</Text>
              </View>
              <View style={styles.tripInfoItem}>
                <Clock color={COLORS.darkGray} size={18} />
                <Text style={styles.tripInfoText}>{currentRide.estimatedDuration} min</Text>
              </View>
              <View style={styles.tripInfoItem}>
                <DollarSign color={COLORS.success} size={18} />
                <Text style={styles.tripInfoText}>{calculateDynamicPrice(currentRide.tripDistance)}</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.actionButton, styles.navigateButton]}>
              <Navigation color={COLORS.white} size={20} />
              <Text style={styles.actionButtonText}>Navegar até Destino</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionButton, styles.secondaryActionButtonElevated]}
              onPress={handleArrivedAtDestination}
            >
              <MapPin color={COLORS.primary} size={20} />
              <Text style={styles.secondaryActionButtonText}>Cheguei ao Destino</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelButton]} onPress={() => setShowCancelModal(true)}>
              <X color={COLORS.danger} size={18} />
              <Text style={styles.cancelButtonText}>Cancelar Corrida</Text>
            </TouchableOpacity>
          </>
        )}

        {rideStage === 'arrived_at_destination' && (
          <>
            <Text style={styles.panelTitle}>Destino Alcançado!</Text>
            <Text style={styles.panelSubtitleBold}>{currentRide.passengerName}</Text>

            <View style={styles.completedContainer}>
              <Check color={COLORS.success} size={50} />
              <Text style={styles.completedText}>Você chegou ao destino</Text>
            </View>

            <View style={styles.finalPriceBox}>
              <Text style={styles.finalPriceLabel}>Valor da Corrida</Text>
              <Text style={styles.finalPriceValue}>
                {calculateDynamicPrice(currentRide.tripDistance)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, styles.endRideButton]}
              onPress={handleEndRide}
            >
              <Check color={COLORS.white} size={20} />
              <Text style={styles.actionButtonText}>Finalizar Corrida</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderCancelModal = () => (
    <Modal visible={showCancelModal} transparent={true} animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AlertTriangle color={COLORS.warning} size={30} />
            <Text style={styles.modalTitle}>Cancelar Corrida</Text>
          </View>

          <Text style={styles.modalSubtitle}>Selecione o motivo do cancelamento:</Text>

          <ScrollView style={styles.reasonsList}>
            {CANCEL_REASONS.map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={styles.reasonItem}
                onPress={() => handleCancelRide(reason)}
              >
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCancelModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          latitude: FALLBACK_LOCATION.latitude,
          longitude: FALLBACK_LOCATION.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onRegionChangeComplete={updateCameraHeading}
      >
        {/* Marcador do Motorista com Círculo Roxo Claro + Carro Branco */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            tracksViewChanges={tracksViewChanges}
          >
            <View style={styles.driverMarkerContainer}>
              {/* Círculo roxo claro preenchido */}
              <View style={styles.driverMarkerCircle} />
              {/* Carro branco rotacionado */}
              <View
                style={{
                  position: 'absolute',
                  transform: [{ rotate: `${(driverLocation.heading ?? 0) - cameraHeading}deg` }],
                }}
              >
                <Car color={COLORS.white} size={20} />
              </View>
            </View>
          </Marker>
        )}

        {/* Marcador de Pickup */}
        {currentRide && (rideStage === 'going_to_pickup' || rideStage === 'arrived_at_pickup') && (
          <Marker coordinate={currentRide.pickupCoords} anchor={{ x: 0.5, y: 1.0 }}>
            <View style={styles.pickupMarker}>
              <View style={styles.pickupMarkerDot} />
            </View>
          </Marker>
        )}

        {/* Marcador de Destino */}
        {currentRide && (rideStage === 'in_progress' || rideStage === 'arrived_at_destination') && (
          <Marker coordinate={currentRide.destinationCoords} anchor={{ x: 0.5, y: 1.0 }}>
            <DestinationMarker />
          </Marker>
        )}

        {/* Rota: Motorista → Pickup */}
        {driverLocation && currentRide && (rideStage === 'going_to_pickup' || rideStage === 'arrived_at_pickup') && (
          <MapViewDirections
            origin={driverLocation}
            destination={currentRide.pickupCoords}
            apikey={GOOGLE_MAPS_API_KEY_AQUI}
            strokeWidth={4}
            strokeColor={COLORS.warning}
            onReady={(result) =>
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 150, right: 50, bottom: 400, left: 50 },
                animated: true,
              })
            }
          />
        )}

        {/* Rota: Pickup → Destino */}
        {driverLocation && currentRide && (rideStage === 'in_progress' || rideStage === 'arrived_at_destination') && (
          <MapViewDirections
            origin={currentRide.pickupCoords}
            destination={currentRide.destinationCoords}
            apikey={GOOGLE_MAPS_API_KEY_AQUI}
            strokeWidth={4}
            strokeColor={COLORS.primary}
            onReady={(result) =>
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 150, right: 50, bottom: 400, left: 50 },
                animated: true,
              })
            }
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handleMenuPress}>
          <Menu color={COLORS.black} size={28} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerStatusText,
              availabilityStatus === 'available'
                ? styles.headerBadgeOnline
                : availabilityStatus === 'on_ride'
                ? styles.headerBadgeOnRide
                : styles.headerBadgeOffline,
            ]}
          >
            {availabilityStatus === 'available'
              ? 'Online'
              : availabilityStatus === 'on_ride'
              ? 'Em Corrida'
              : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
          <User color={COLORS.black} size={28} />
        </TouchableOpacity>
      </View>

      {/* Painéis */}
      {availabilityStatus === 'unavailable' && renderUnavailablePanel()}
      {availabilityStatus === 'available' && incomingRequests.length === 0 && renderAvailablePanel()}
      {availabilityStatus === 'available' && incomingRequests.length > 0 && renderRequestPanel()}
      {availabilityStatus === 'on_ride' && renderOnRidePanel()}

      {/* Modal de Cancelamento */}
      {renderCancelModal()}
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

  // Marcador do Motorista
  driverMarkerContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  driverMarkerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(110, 23, 235, 0.25)',
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  destinationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  destinationMarkerPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  pickupMarker: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pickupMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.warning,
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
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
  panelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  panelSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 20,
    textAlign: 'center',
  },
  panelSubtitleBold: {
    fontSize: 18,
    color: COLORS.black,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },

  periodBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  periodBadgeSmall: {
    backgroundColor: COLORS.lightPurple,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 16,
    paddingHorizontal: 30,
    marginTop: 10,
    width: '90%',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginTop: 15,
  },
  secondaryActionButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryActionButtonElevated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 15,
    width: '90%',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  goAvailableButton: { backgroundColor: COLORS.success, shadowColor: COLORS.success },
  goUnavailableButton: { backgroundColor: COLORS.danger, shadowColor: COLORS.danger },
  navigateButton: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, marginBottom: 5 },
  startRideButton: { backgroundColor: COLORS.success, shadowColor: COLORS.success },
  endRideButton: { backgroundColor: COLORS.success, shadowColor: COLORS.success },
  offlineButtonInRequests: { marginTop: 15 },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 12,
    width: '90%',
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },

  requestScrollContent: { paddingBottom: 10 },
  requestPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.mediumGray,
    marginVertical: 15,
  },
  rideInfoSection: {
    marginBottom: 5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    marginTop: 4,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
    lineHeight: 20,
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.mediumGray,
    marginLeft: 5,
    marginVertical: 5,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  requestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  requestButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  acceptButtonText: { color: COLORS.white },
  declineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  declineButtonText: { color: COLORS.danger },

  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 15,
    gap: 10,
    width: '90%',
  },

  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  waitingText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },

  tripInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    width: '90%',
  },
  tripInfoItem: {
    alignItems: 'center',
    gap: 5,
  },
  tripInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
  },

  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  completedText: {
    fontSize: 16,
    color: COLORS.success,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: 'bold',
  },

  finalPriceBox: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    width: '90%',
  },
  finalPriceLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
    fontWeight: '500',
  },
  finalPriceValue: {
    fontSize: 32,
    color: COLORS.success,
    fontWeight: 'bold',
  },

  // Modal de cancelamento
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 20,
  },
  reasonsList: {
    maxHeight: 300,
  },
  reasonItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  reasonText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  modalCloseButton: {
    backgroundColor: COLORS.mediumGray,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
});