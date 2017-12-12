// get access to bluetooth name and store into app as some sort of username for pairing


import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableHighlight,
    NativeEventEmitter,
    NativeModules,
    Platform,
    PermissionsAndroid,
    ListView,
    ScrollView,
    AppState } from 'react-native';
import BleManager from 'react-native-ble-manager';
import TimerMixin from 'react-timer-mixin';
import reactMixin from 'react-mixin';
import Header from './src/components/Header';


const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);


export default class App extends Component {
    constructor() {
        super();

        this.state = {
            scanning: false,
            peripherals: new Map(),
            appState: ''
        };

        this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
        this.handleStopScan = this.handleStopScan.bind(this);
        this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
        this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);

        // NativeAppEventEmitter.addListener('DiscoverPeripheral', (data) => {
        //     console.log('Added native app event emitter listener');
        //     let device = `device found: ${data.name} (${data.id})`;
        //
        //     if (this.devices.indexOf(device) === -1) {
        //         this.devices.push(device);
        //     }
        //
        //     let newState = this.state;
        //     newState.dataSource = newState.dataSource.cloneWithRows(this.devices);
        //     this.setState(newState);
        // });
    }

    componentDidMount() {
        // iOS apps do not allow BLE to be turned on natively yet, so do separate things for iOS and Android

        console.log('Bluetooth Scanner mounted');

        AppState.addEventListener('change', this.handleAppStateChange);

        BleManager.start({ showAlert: false })
            .then(() => {
                // Success code
                console.log('Module initialized');
            })
            .catch((err) => {
                console.log(`Module initialization failed: ${err}`);
            });

        this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
        this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
        this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
        this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );

        if (Platform.OS === 'android' && Platform.Version >= 23) {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                    console.log("Permission is OK");
                } else {
                    PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                        if (result) {
                            console.log("User accept");
                        } else {
                            console.log("User refuse");
                        }
                    });
                }
            });
        }
    }

    handleAppStateChange(nextAppState) {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            console.log('App has come to the foreground!')
            BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
                console.log('Connected peripherals: ' + peripheralsArray.length);
            });
        }
        this.setState({appState: nextAppState});
    }

    componentWillUnmount() {
        this.handlerDiscover.remove();
        this.handlerStop.remove();
        this.handlerDisconnect.remove();
        this.handlerUpdate.remove();
    }

    handleDisconnectedPeripheral(data) {
        let peripherals = this.state.peripherals;
        let peripheral = peripherals.get(data.peripheral);
        if (peripheral) {
            peripheral.connected = false;
            peripherals.set(peripheral.id, peripheral);
            this.setState({peripherals});
        }
        console.log('Disconnected from ' + data.peripheral);
    }

    handleUpdateValueForCharacteristic(data) {
        console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    }

    handleStopScan() {
        console.log('Scan is stopped');
        this.setState({ scanning: false });
    }

    startScan() {
        if (!this.state.scanning) {
            BleManager.scan([], 3, true).then((results) => {
                console.log('Scanning...');
                this.setState({scanning:true});
            });
        }
    }

    handleDiscoverPeripheral(peripheral){
        var peripherals = this.state.peripherals;
        if (!peripherals.has(peripheral.id)){
            console.log('Got ble peripheral', peripheral);
            peripherals.set(peripheral.id, peripheral);
            this.setState({ peripherals })
        }
    }

    test(peripheral) {
        if (peripheral){
            if (peripheral.connected){
                BleManager.disconnect(peripheral.id);
            } else{
                BleManager.connect(peripheral.id).then(() => {
                    let peripherals = this.state.peripherals;
                    let p = peripherals.get(peripheral.id);
                    if (p) {
                        p.connected = true;
                        peripherals.set(peripheral.id, p);
                        this.setState({peripherals});
                    }
                    console.log('Connected to ' + peripheral.id);


                    this.setTimeout(() => {

                        /* Test read current RSSI value
                        BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
                          console.log('Retrieved peripheral services', peripheralData);
                          BleManager.readRSSI(peripheral.id).then((rssi) => {
                            console.log('Retrieved actual RSSI value', rssi);
                          });
                        });*/

                        // Test using bleno's pizza example
                        // https://github.com/sandeepmistry/bleno/tree/master/examples/pizza
                        BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
                            console.log(peripheralInfo);
                            var service = '1802';
                            var bakeCharacteristic = '2A06';
                            var crustCharacteristic = '13333333-3333-3333-3333-333333330001';

                            this.setTimeout(() => {
                                // READ example
                                // BleManager.read(peripheral.id, service, bakeCharacteristic).then((readData) => {
                                //     console.log('Reading peripheral: ' + readData);
                                // }).catch((error) => {
                                //     console.log('Read error: ', error);
                                // });

                                // WRITE example
                                BleManager.write(peripheral.id, service, bakeCharacteristic, [447199]).then(() => {
                                    console.log('Write: success' );
                                }).catch((error) => {
                                    console.log('Write error: ', error);
                                });

                                // BleManager.startNotification(peripheral.id, service, bakeCharacteristic).then(() => {
                                //     console.log('Started notification on ' + peripheral.id);
                                //     this.setTimeout(() => {
                                //         BleManager.write(peripheral.id, service, crustCharacteristic, [0]).then(() => {
                                //             console.log('Writed NORMAL crust');
                                //             BleManager.write(peripheral.id, service, bakeCharacteristic, [1,95]).then(() => {
                                //                 console.log('Writed 351 temperature, the pizza should be BAKED');
                                //             });
                                //         });
                                //
                                //     }, 500);
                                // }).catch((error) => {
                                //     console.log('Notification error', error);
                                // });
                            }, 200);
                        });

                    }, 900);
                }).catch((error) => {
                    console.log('Connection error', error);
                });
            }
        }
    }

    render() {
        const list = Array.from(this.state.peripherals.values());
        const dataSource = ds.cloneWithRows(list);


        return (
            <View style={styles.container}>
                <Header headerText="Ble Manager" />
                <TouchableHighlight style={{marginTop: 30,margin: 20, padding:20, backgroundColor:'#ccc'}} onPress={() => this.startScan() }>
                    <Text>Scan Bluetooth ({this.state.scanning ? 'on' : 'off'})</Text>
                </TouchableHighlight>
                <ScrollView style={styles.scroll}>
                    {(list.length === 0) &&
                    <View style={{flex:1, margin: 20}}>
                        <Text style={{textAlign: 'center'}}>No peripherals</Text>
                    </View>
                    }
                    <ListView
                        enableEmptySections={true}
                        dataSource={dataSource}
                        renderRow={(item) => {
                            const color = item.connected ? 'green' : '#fff';
                            return (
                                <TouchableHighlight onPress={() => this.test(item) }>
                                    <View style={[styles.row, {backgroundColor: color}]}>
                                        <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
                                        <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 10}}>{item.id}</Text>
                                    </View>
                                </TouchableHighlight>
                            );
                        }}
                    />
                </ScrollView>
            </View>
        );
    }
}


reactMixin(App.prototype, TimerMixin);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        width: window.width,
        height: window.height
    },
    scroll: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        margin: 10,
    },
    row: {
        margin: 10
    },
});
