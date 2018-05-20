#!/usr/bin/env python

import argparse
import json
import sys

from scapy.all import *


# List of IP Protocol Names
IP_PROTO = {
    0: 'HOPOPT',
    1: 'ICMP',
    2: 'IGMP',
    3: 'GGP',
    4: 'IP-in-IP',
    5: 'ST',
    6: 'TCP',
    7: 'CBT',
    8: 'EGP',
    9: 'IGP',
    10: 'BBN-RCC-MON',
    11: 'NVP-II',
    12: 'PUP',
    13: 'ARGUS',
    14: 'EMCON',
    15: 'XNET',
    16: 'CHAOS',
    17: 'UDP',
    18: 'MUX',
    19: 'DCN-MEAS',
    20: 'HMP',
    # TODO: missing
    41: 'IPv6',
    42: 'SDRP',
    43: 'IPv6-Route',
    44: 'IPv6-Frag',
    # TODO: missing
    51: 'AH',
    # TODO: missing
    58: 'IPv6-ICMP',
    59: 'IPv6-NoNxt',
    60: 'IPv6-Opts'
    # TODO: missing
}


# https://stackoverflow.com/a/46841935
class SerializableGenerator(list):
    """Generator that is serializable by JSON

    It is useful for serializing huge data by JSON
    >>> json.dumps(SerializableGenerator(iter([1, 2])))
    "[1, 2]"
    >>> json.dumps(SerializableGenerator(iter([])))
    "[]"

    It can be used in a generator of json chunks used e.g. for a stream
    >>> iter_json = ison.JSONEncoder().iterencode(SerializableGenerator(iter([])))
    >>> tuple(iter_json)
    ('[1', ']')
    # >>> for chunk in iter_json:
    # ...     stream.write(chunk)
    # >>> SerializableGenerator((x for x in range(3)))
    # [<generator object <genexpr> at 0x7f858b5180f8>]
    """

    def __init__(self, iterable):
        tmp_body = iter(iterable)
        try:
            self._head = iter([next(tmp_body)])
            self.append(tmp_body)
        except StopIteration:
            self._head = []

    def __iter__(self):
        return itertools.chain(self._head, *self[:1])


def parse_pcap(input_file):
    reader = PcapReader(input_file.name)

    for packet in reader:
        pkg_dict = {'timestamp': packet.time, 'pkg_size': len(packet)}

        if 'IP' in packet:
            pkg_dict['src_ip'] = packet[IP].src
            pkg_dict['dst_ip'] = packet[IP].dst
            proto = packet[IP].proto
            pkg_dict['protocol'] = IP_PROTO[proto] if proto in IP_PROTO else proto
            if 'TCP' in packet:
                pkg_dict['src_port'] = packet[TCP].sport
                pkg_dict['dst_port'] = packet[TCP].dport
            elif 'UDP' in packet:
                pkg_dict['src_port'] = packet[UDP].sport
                pkg_dict['dst_port'] = packet[UDP].dport

        elif 'ARP' in packet:
            continue  # TODO: ignored

        else:
            continue  # TODO: ignored
        #packet.show()
        yield pkg_dict


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument('inputfile', help='pcap file to analyze', type=argparse.FileType('r'))

    args = parser.parse_args()

    packages = parse_pcap(args.inputfile)

    data = {
        'file': args.inputfile.name,
        'packages': SerializableGenerator(packages)
    }

    json.dump(data, sys.stdout, indent=4)
