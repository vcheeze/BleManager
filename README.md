# BleManager
I created this app following the example on the GitHub page of the library [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager).
Parts of it are adapted according to the needs of my project.

## Ways to Establish a Connection
* Traditional: entering a code
* Profile Pictures
* QR Code: scan and allow pairing/connection

The pairing phase is especially important because we aim to provide a smooth and
swift user experience. The most common way of pairing - entering codes -
requires more from the user, as they have to type several characters and risk
typing something wrong while they do so.

The second option uses profile pictures to identify who you want to talk to. It
is complex to implement. To begin with, we have to ensure that users put a
recent and accurate profile picture in their profiles, so that they can be
easily identifiable when their picture shows up on another person's device.

## Data That Needs to be Transmitted
* Messages (IDs)
* Gender: according to the profiles set up by the users
* Age: for language of deference
