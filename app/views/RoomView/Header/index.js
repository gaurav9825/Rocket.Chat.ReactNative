import React from 'react';
import { Text, View, Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { HeaderBackButton } from 'react-navigation';

import RocketChat from '../../../lib/rocketchat';
import realm from '../../../lib/realm';
import Avatar from '../../../containers/Avatar';
import { STATUS_COLORS } from '../../../constants/colors';
import styles from './styles';
import { closeRoom } from '../../../actions/room';
import Touch from '../../../utils/touch';


@connect(state => ({
	user: state.login.user,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	activeUsers: state.activeUsers
}), dispatch => ({
	close: () => dispatch(closeRoom())
}))
export default class RoomHeaderView extends React.PureComponent {
	static propTypes = {
		close: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		user: PropTypes.object.isRequired,
		baseUrl: PropTypes.string,
		activeUsers: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.state = {
			room: {},
			roomName: props.navigation.state.params.room.name
		};
		this.rid = props.navigation.state.params.room.rid;
		this.room = realm.objects('subscriptions').filtered('rid = $0', this.rid);
		this.room.addListener(this.updateState);
	}

	componentDidMount() {
		this.updateState();
	}
	componentWillUnmount() {
		this.room.removeAllListeners();
	}

	getUserStatus() {
		const userId = this.rid.replace(this.props.user.id, '').trim();
		const userInfo = this.props.activeUsers[userId];
		return (userInfo && userInfo.status) || 'offline';
	}

	getUserStatusLabel() {
		const status = this.getUserStatus();
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	updateState = () => {
		this.setState({ room: this.room[0] });
	};

	isDirect = () => this.state.room && this.state.room.t === 'd';

	renderLeft = () => (<HeaderBackButton
		onPress={() => {
			this.props.navigation.goBack(null);
			requestAnimationFrame(() => this.props.close());
		}}
		tintColor='#292E35'
		title='Back'
		titleStyle={{ display: 'none' }}
	/>);

	renderTitle() {
		if (!this.state.roomName) {
			return null;
		}

		let accessibilityLabel = this.state.roomName;

		if (this.isDirect()) {
			accessibilityLabel += `, ${ this.getUserStatusLabel() }`;
		}

		return (
			<TouchableOpacity
				style={styles.titleContainer}
				accessibilityLabel={accessibilityLabel}
				accessibilityTraits='header'
				onPress={() => this.props.navigation.navigate({ key: 'RoomInfo', routeName: 'RoomInfo', params: { rid: this.rid } })}
			>
				{this.isDirect() ?
					<View style={[styles.status, { backgroundColor: STATUS_COLORS[this.getUserStatus()] }]} />
					: null
				}
				<Avatar
					text={this.state.roomName}
					size={24}
					style={{ marginRight: 5 }}
					baseUrl={this.props.baseUrl}
					type={this.state.room.t}
				/>
				<View style={{ flexDirection: 'column' }}>
					<Text style={styles.title} allowFontScaling={false}>{this.state.roomName}</Text>
					{this.isDirect() ?
						<Text style={styles.userStatus} allowFontScaling={false}>{this.getUserStatusLabel()}</Text>
						: null
					}
				</View>
			</TouchableOpacity>
		);
	}

	renderRight = () => (
		<View style={styles.right}>
			<Touch
				onPress={() => RocketChat.toggleFavorite(this.room[0].rid, this.room[0].f)}
				accessibilityLabel='Star room'
				accessibilityTraits='button'
				underlayColor='#FFFFFF'
				activeOpacity={0.5}
			>
				<View style={styles.headerButton}>
					<Icon
						name={`${ Platform.OS === 'ios' ? 'ios' : 'md' }-star${ this.room[0].f ? '' : '-outline' }`}
						color='#f6c502'
						size={24}
						backgroundColor='transparent'
					/>
				</View>
			</Touch>
			<TouchableOpacity
				style={styles.headerButton}
				onPress={() => this.props.navigation.navigate({ key: 'RoomActions', routeName: 'RoomActions', params: { rid: this.room[0].rid } })}
				accessibilityLabel='Room actions'
				accessibilityTraits='button'
			>
				<Icon
					name={Platform.OS === 'ios' ? 'ios-more' : 'md-more'}
					color='#292E35'
					size={24}
					backgroundColor='transparent'
				/>
			</TouchableOpacity>
		</View>
	);

	render() {
		return (
			<View style={styles.header}>
				{this.renderLeft()}
				{this.renderTitle()}
				{this.renderRight()}
			</View>
		);
	}
}
